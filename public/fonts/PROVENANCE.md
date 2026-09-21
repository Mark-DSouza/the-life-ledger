# Where `inter-variable-latin.woff2` came from

Inter v20, latin subset, variable. 48,256 bytes,
`sha256:3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62`.

Licensed under the SIL Open Font License 1.1 — `OFL.txt` in this directory is
the notice the licence requires to travel with the font. Copyright (c) 2016 The
Inter Project Authors, https://github.com/rsms/inter.

Fetched once, by hand, from Google Fonts' CDN and committed here. Linking to
that CDN at runtime is what `docs/adr/0004-self-hosted-ui-webfont.md` decided
against; taking a copy from it is a different thing, and is what the OFL exists
to permit.

To reproduce the exact bytes:

```bash
# The URL is not stable across Google Fonts releases — read it out of the CSS
# rather than pasting it, or you will silently get a different version.
curl -sS -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" \
  | awk '/\/\* latin \*\//{f=1} f && /src: url/{print; exit}'
# then GET the url it prints, and check the sha256 above
```

The `unicode-range` in `src/styles.css` is copied from that same `/* latin */`
block, so it states the subset's real coverage rather than a guess.

## Why this build rather than upstream `rsms.me/inter`

Because it answers the question the ticket ([#83]) flagged as unanswerable from
a version number: Inter v4 carries an optical-size axis, and whether a given
release exposes it changes whether `font-variation-settings` is needed.

Google Fonts serves a **partial instance**: asking for `wght@100..900` alone
pins every other axis out. Read straight from this file's `fvar` table, that is

```
axisCount: 1
  wght  min=100 default=400 max=900
```

so `font-weight` drives it and there is no `opsz` to wire up. Two checks
confirm the partial-instancing rather than inferring it: requesting
`family=Inter:opsz,wght@14..32,100..900` from the same API returns a
_different_ file URL, and `GSUB` here carries `calt ccmp dnom frac locl numr
pnum tnum` — `tnum` being the feature `--font-sans--font-feature-settings`
turns on.

Re-derive the axis list with `node --input-type=module`, which needs nothing
installed (Node's `zlib` has brotli, which is all a WOFF2 table directory
needs):

```js
import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

// The 63 known table tags, by index. Comma-separated because four of them
// carry a significant trailing space ("OS/2" does not, "cvt " does).
const TAGS =
  "cmap,head,hhea,hmtx,maxp,name,OS/2,post,cvt ,fpgm,glyf,loca,prep,CFF ,VORG,EBDT,EBLC,gasp,hdmx,kern,LTSH,PCLT,VDMX,vhea,vmtx,BASE,GDEF,GPOS,GSUB,EBSC,JSTF,MATH,CBDT,CBLC,COLR,CPAL,SVG ,sbix,acnt,avar,bdat,bloc,bsln,cvar,fdsc,feat,fmtx,fvar,gvar,hsty,just,lcar,mort,morx,opbd,prop,trak,Zapf,Silf,Glat,Gloc,Feat,Sill".split(
    ",",
  );

const buf = readFileSync("public/fonts/inter-variable-latin.woff2");
let p = 48; // the WOFF2 header is fixed-size; the table directory follows it
const base128 = () => {
  let v = 0;
  for (;;) {
    const b = buf[p++];
    v = (v << 7) | (b & 0x7f);
    if (!(b & 0x80)) return v >>> 0;
  }
};

const dir = [];
for (let i = 0; i < buf.readUInt16BE(12); i++) {
  const flags = buf[p++];
  const tag =
    (flags & 0x3f) === 0x3f ? ((p += 4), buf.toString("ascii", p - 4, p)) : TAGS[flags & 0x3f];
  const orig = base128();
  // glyf and loca invert the convention: for them, version 0 means transformed.
  const version = flags >> 6;
  const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
  // A transformed table occupies its transformLength in the stream, not its
  // original length — getting this wrong silently shifts every later table.
  dir.push({ tag, length: transformed ? base128() : orig });
}

// Tables are concatenated in directory order, with no padding between them.
const data = brotliDecompressSync(buf.subarray(p));
let off = 0;
const at = {};
for (const { tag, length } of dir) {
  at[tag] = off;
  off += length;
}

const f = data.subarray(at.fvar);
const axesAt = f.readUInt16BE(4);
const count = f.readUInt16BE(8);
const size = f.readUInt16BE(10);
console.log("axisCount:", count);
for (let i = 0; i < count; i++) {
  const a = axesAt + i * size;
  const fx = (o) => f.readInt32BE(o) / 65536; // axis values are Fixed 16.16
  console.log(
    ` ${f.toString("ascii", a, a + 4)} min=${fx(a + 4)} default=${fx(a + 8)} max=${fx(a + 12)}`,
  );
}
```

[#83]: https://github.com/Mark-DSouza/the-life-ledger/issues/83
