// Egg sprites for the first-run hatching selection — one ornate egg per
// species (public/beasts/eggs/<speciesKey>.png, 64x80, PixelLab object mode).
// On first log-in the Byte Beasts are presented inside these eggs; choosing
// one hatches it into the animated beast. Keyed by the species KEY (so the
// Qilin's egg is eggs/unicorn.png, matching its internal key).

export const eggSrc = (species) =>
  `${import.meta.env.BASE_URL}beasts/eggs/${species}.png`
    .replace(/\/{2,}/g, '/')
    .replace(':/', '://');
