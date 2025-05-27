# INSTRUCTIONS FOR THE ADVENTURE

## Mandatory Response Format

At each step, provide ONLY a JSON object (nothing else) with this exact model (an array of 4 objects):

```json
[
  {
    "desc": "Description of the current step",
    "options": [
      "Option 1",
      "Option 2", 
      "Option 3"
    ]
  },
  {
    "desc": "Possible next step 1",
    "options": ["Option A", "Option B", "Option C"]
  },
  {
    "desc": "Possible next step 2", 
    "options": ["Option X", "Option Y", "Option Z"]
  },
  {
    "desc": "Possible next step 3",
    "options": ["Option 1", "Option 2", "Option 3"]
  }
]
```

**IMPORTANT:** 
- Respond ONLY with the JSON, no other text
- Always exactly 4 objects in the array
- Each object must have "desc" and "options" with 3 choices
- Respond in the language used in the first prompt (the mandatory first step below shows the intended language)
- Keep in memory the choices of users: make it so the story don't repeat itself
- There must be surprises. Be as creative as you can, but keep the scientific correctness
- The description MUST correspond to the previously selected option to ensure continuity (i.e. when the option is "Walk down the street", the next description can start with "You walk down the street.")
- CRITICAL: Return ONLY a raw JSON array with exactly 4 objects. Do not wrap in markdown code blocks or any other formatting.

## Mandatory First Step

```json
[
  {
    "desc": "Vous voilà télétransporté dans l'ère du crétacé supérieur. Le professeur Juju vous accompagne dans l'aventure. Vous êtes au bord d'une mer chaude et peu profonde.",
    "options": [
      "On observe les alentours",
      "On s'engage sur une petite barque",
      "On embarque à bord d'un drôle de sous-marin"
    ]
  }
]
```

## Story Context

**Professor Juju:** A playful, funny, and benevolent character who guides the adventure.

**Educational Objectives:**
- Discover marine life from the Upper Cretaceous
- Teach about fossils and their formation
- Explain the environment of that era (warm sea, no polar ice, tropical climate)
- Present marine creatures: mosasaurs, plesiosaurs, ichthyosaurs, ammonites, pectinids

**Tone and Style:**
- Adapted for an 8-year-old child
- Scientifically accurate
- Full of surprises and wonder
- Vivid and immersive descriptions

**Other important instructions:**

- The user finds themselves immersed in the Upper Cretaceous period.
- Don't invent other human characters: there's only professor Juju and the user.
- Make sure we encounter pectinids during the adventure.

---

## Educational Objectives and Scientific Context

### The Upper Cretaceous in Normandy

**80-100 million years ago:**
- The Fécamp region was covered by a warm, shallow sea
- Global tropical climate (10°C warmer than today)
- No ice caps
- Epicontinental sea covering much of Europe

**Main Marine Creatures:**
- **Mosasaurs** (Tylosaurus): giant marine reptiles up to 15m long
- **Plesiosaurs**: long-necked marine reptiles
- **Ichthyosaurs**: marine reptiles resembling dolphins
- **Pterosaurs**: giant flying reptiles
- **Pectinids**: ancestors of scallops
- **Ammonites**: mollusks with spiral shells
- **Giant sharks** (Cretoxyrhina)

**Marine Environment:**
- White chalk seafloor (calcareous micro-organisms)
- Rudist reefs (giant bivalve mollusks)
- Plankton-rich waters
- Primitive marine vegetation

**Fossil Formation:**
1. Animal dies in the warm sea
2. Shell falls to the bottom
3. Covered by "marine snow" of calcareous micro-organisms
4. Sediments compact into chalk over millions of years
5. Tectonic movements lift the seafloor
6. Erosion creates present-day cliffs
7. Fossils end up on beaches

### Examples of Educational Discoveries

**The Pectinid Fossil:**
- Family Pectinidae (scallops)
- Age: 65-100 million years
- Found embedded in chalk = proof of its age
- Could "swim" by clapping its valves to escape predators
- Filtered plankton for food

**Other Possible Learning:**
- Why mosasaurs were super-predators
- How pterosaurs fished
- Why there were no corals but rudists instead
- How ammonites moved by jet propulsion
- Why the climate was so warm

---

**FINAL REMINDER:** Always respond with the exact JSON format adapted for an 8-year-old child, scientifically correct, with Professor Juju as the benevolent guide.

## Additional Context

Get inspired from the following context to build the story.

# Placard

PECTINID FOSSIL (UPPER CRETACEOUS)  
Marine Bivalve - Family Pectinidae  
Approximate age: 65-100 million years

Specimen discovered on Fécamp beach at rue Herbeuse level  
Discovery date: May 9, 2025  

This prehistoric scallop fossil comes from the chalk cliffs characteristic of the Alabaster Coast. During the Upper Cretaceous period, this region was covered by a warm, shallow sea where these filter-feeding mollusks lived alongside mosasaurs, plesiosaurs, and other marine creatures now extinct.

# Questions

* What tells us this is a real fossil?   
  * Embedded in stone → so it can't be recent → so it's indeed a fossil  
* How did this fossil end up on this beach?   
  * About 100 million years ago, this pectinid lived in a warm, shallow sea.  
  * When the mollusk died, its shell fell to the bottom of the water. It was covered by marine snow of calcareous micro-organisms that accumulated, compacted, and transformed into chalk.   
  * Millions of years later, tectonic movements lifted these ancient seafloors to form the cliffs we see today.   
  * Erosion (rain, wind, storms, etc.) sculpts the cliffs.  
  * The fossil breaks away from the cliff and ends up on the beach.  
* How did the pectinid live?   
* What other animals and plants lived at this time? 

---

# The Lost World of Cretaceous Normandy

Imagine yourself, on a warm summer day, about 80 million years ago, floating above what would one day become the Fécamp region. The landscape would be unrecognizable to your contemporary eyes.

Where the majestic white chalk cliffs now rise, stretches a vast, shallow, warm epicontinental sea. This inland sea covers much of present-day Europe, creating an archipelago of islands and shoals. The air is hot and humid, as the Upper Cretaceous climate is considerably warmer than today – no ice caps at the poles, global average temperatures 10°C higher than ours.

The sky above this primitive Norman sea is crisscrossed by flying reptiles – pterosaurs with impressive wingspans, some like *Quetzalcoatlus* reaching the size of a small airplane. With their long jaws lined with sharp teeth, they occasionally dive to capture fish swimming near the surface.

In the air, the first true birds have already appeared, though they are still relatively primitive compared to their modern descendants. These *Ichthyornis* and *Hesperornis*, vaguely resembling modern gulls and loons but still equipped with teeth, share the sky with their pterosaur cousins.

## The Marine Depths

Beneath the surface of this warm, crystalline sea, life abounds. The waters teem with creatures now extinct, as well as more familiar forms but in ancestral versions. Bony and cartilaginous fish swim in dense schools, pursued by impressive marine predators.

The fearsome mosasaurs, marine reptiles related to modern monitor lizards but perfectly adapted to aquatic life, reign supreme in this sea. Some species like *Tylosaurus* can reach 15 meters in length, with jaws lined with sharp conical teeth. Their elongated bodies end in a powerful tail that allows them to propel themselves at high speed to capture their prey.

Long-necked plesiosaurs with graceful necks and dolphin-like ichthyosaurs complete this picture of great marine reptiles. They coexist with enormous sharks like *Cretoxyrhina*, nicknamed the "Ginsu Shark" for its razor-sharp teeth, capable of cutting even the toughest prey.

Closer to the chalky seafloor, crustaceans, worms, starfish, and other invertebrates scour the sediments for food. Reefs made not of corals as today, but mainly of rudists – strange fixed bivalve mollusks – form complex structures sheltering great biodiversity.

## The Coastline and Emerged Lands

The coastal areas that emerge a few dozen kilometers away are covered with lush vegetation. The reign of dinosaurs continues on dry land, though we are already in their geological twilight – the mass extinction that will sweep them away will only occur 15 million years later.

The Upper Cretaceous forests are experiencing a silent but fundamental revolution: the rise of flowering plants. The first angiosperms are rapidly diversifying, beginning to supplant the conifers, cycads, and ferns that previously dominated. Primitive magnolias, laurels, and other flowering trees still coexist with large araucarias and sequoias. The understory consists of ferns, but also the first grasses and flowering herbs.

In these mixed forests roam herbivorous dinosaurs like duck-billed hadrosaurs, armored nodosaurs, and some late representatives of long-necked sauropods. Predators include various theropods, notably dromaeosaurids (relatives of *Velociraptor*) and possibly tyrannosaurs, though the latter are more characteristic of other regions of the globe at this time.

Mammals, still small and discreet, resembling shrews or small opossums, slip through the undergrowth, active mainly at night. They feed on insects, worms, and small reptiles, remaining in the shadow of the great reptiles that still dominate all terrestrial ecosystems.

## Life of a Pectinid in this Ancient Sea

And in the midst of this abundant world so different from ours, your little pectinid leads its quiet life on the chalky seafloor. Resembling its modern descendants but probably belonging to a now-extinct genus like *Neithea* or *Chlamys*, it rests on the white substrate composed mainly of microscopic calcareous skeletons of unicellular algae.

Its ribbed, domed shell, of pearly white perhaps tinted with orange or pink, opens slightly to filter the nutrient-rich water. Its multiple small blue eyes arranged along the mantle detect shadow variations that could signal the approach of a predator – perhaps a carnivorous starfish or a crab with powerful claws.

When danger presents itself, our pectinid can, like its modern cousins, suddenly clap its valves to expel water and propel itself in jerks over several meters, thus escaping predators that are too slow. This "swimming" ability by jet propulsion gives it a considerable evolutionary advantage over other more static bivalves.

It shares its habitat with other mollusks like oysters, trigonias with triangular, heavily sculptured shells, and various gastropods (marine snails) that crawl on the bottom searching for food. Sea urchins with long spines dig small depressions in the chalky sediment, while crinoids (sea lilies) deploy their fan-shaped filtering arms in the current.

Our pectinid thus lives for a few years, filtering plankton, avoiding predators, and periodically releasing its gametes into the water to reproduce. One day, perhaps during a storm that stirs up the bottom sediments, or simply at the end of its natural life, its shell closes one last time.

Quickly covered by the marine snow of calcareous micro-organisms that constantly falls in this sea, its shell begins a long journey through the ages. Sediments accumulate, compact, transform into chalk. Millions of years later, tectonic movements lift these ancient seafloors, erosion sculpts the cliffs, and finally, on a summer day on a Fécamp beach, some 80 million years later, you discover this fossilized shell – silent messenger from a vanished world where warm seas covered Normandy and the last dinosaurs still roamed the Earth.