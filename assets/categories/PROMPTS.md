# Category photo bank — generation prompts

25 prompts (5 per category) for the placeholder photo bank. Generate at
**4:3 landscape** (cards crop with `cover`; 1600×1200 is plenty — the build
pipeline resizes to 800px JPEG). Works in Midjourney, Firefly, DALL-E, etc.

**Append this style suffix to EVERY prompt** so the bank reads as one collection:

> — realistic construction photography, Canadian residential jobsite, warm
> natural daylight, fresh SPF lumber tones, shallow depth of field, no text,
> no watermarks, no logos, no branding on clothing

Negative prompt (where supported): `text, watermark, logo, cartoon, illustration, distorted hands`

When the images are ready: drop them on the Desktop named
`<category>-1.jpg … <category>-5.jpg` (e.g. `framing-3.jpg`) and ask the
agent to wire them — `CategoryPhoto` already supports any number of variants
per category, picked deterministically per listing so the same ad always
shows the same photo.

---

## Framing (`framing`)

1. Two carpenters raising a framed stud wall on a plywood subfloor deck of a
   new two-storey house, pushing the wall upright at sunrise
2. Interior of a newly framed house, sunlight streaming through the stud
   walls and window openings, long shadows across the subfloor
3. Close-up of a framing nailer driving a nail into a doubled top plate,
   gloved hands, sawdust in the air
4. Full exterior view of a house skeleton mid-frame — first floor walls up,
   second floor joists being laid, blue sky behind
5. Framed floor system from above: joists, rim board and a stack of plywood
   sheets ready to be laid, chalk lines visible

## Roof framer (`roof_framing`)

1. Roof trusses being lifted by a boom crane onto a framed house, one worker
   guiding the truss into place against a clear sky
2. Row of installed roof trusses seen from inside the attic space, repeating
   triangles of fresh lumber, light through the gaps
3. Carpenter sheeting a roof deck with OSB panels, kneeling on the slope,
   nail gun in hand, harness line visible
4. Gable end and ridge of a newly framed roof against dramatic evening sky,
   rafter tails overhanging
5. Stack of prefabricated roof trusses lying flat on a jobsite driveway,
   framed house waiting in the background

## Backframer (`backframing`)

1. Basement interior with new wood furring walls built against the concrete
   foundation, straight studs, work light glow
2. Framed bulkhead boxing around HVAC ducts along a basement ceiling, clean
   lumber lines against the joists
3. Newly framed interior staircase and stairwell walls inside an unfinished
   house, curved or straight stringers, warm light
4. Interior partition walls and closet framing on an upper floor, doorway
   openings in a row down a hallway
5. Carpenter measuring and marking a basement wall plate with a tape and
   pencil, level leaning against the studs

## Strapping (`strapping`)

1. Ceiling strapping grid — evenly spaced 1x3 boards running across floor
   joists overhead, seen from below in a wide room
2. Close-up of strapping boards crossing engineered floor joists, screws and
   fresh wood detail, shallow focus
3. Large basement ceiling fully strapped and ready for drywall, straight
   parallel lines converging in perspective
4. Carpenter on a low bench installing ceiling strapping with a cordless
   driver, arms overhead, face turned away
5. Corner view of a strapped ceiling meeting framed walls, showing the level
   plane the strapping creates

## General labour (`general_labour`)

1. Labourer carrying a bundle of 2x4 lumber on the shoulder across a framed
   house interior, hard hat and gloves
2. Wheelbarrow loaded with wood offcuts being pushed across a jobsite, framed
   walls in the background
3. Worker sweeping sawdust off a plywood subfloor with a wide push broom,
   dust in a sunbeam
4. Two workers unloading lumber from a delivery truck at a residential
   jobsite, stacking it on skids
5. Neatly staged jobsite materials — lumber stacks, sheathing and strapping
   bundles lined up beside a house under construction
