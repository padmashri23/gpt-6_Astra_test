# Visual direction and assets

Concept: `docs/design-concept.png`.
Production key art: `public/assets/menu-art.png`.
Method: built-in image generation; no API credentials or third-party fighting-game assets.

The original concept brief asked for a full 1536 × 1024 browser-game menu: CINDER CIRCUIT in cream condensed italic type, charcoal surfaces, lime primary actions, warm sunset foundry, a lean ivory/teal-clad kickboxer with orange scarf, and a heavier orange/charcoal armored boxer. It specified four working menu choices (Enter the Circuit, Quick Match, Training, How to Play), a sound control, three fighters, two arenas, and a readable health/timer visual direction.

The production edit requested removal of every text element, logo, button, HUD, and watermark from that concept, preserving the original environment and fighters on the right with negative space on the left. The resulting background is consumed only as main-menu key art. All visible menu text, controls, and HUD elements are real HTML/CSS. Gameplay characters and arenas are modeled, rendered, and animated in Three.js.

Design tokens: near-black `#141614`, cream `#eeeedb`, lime `#d8f36a`, orange `#f28c50`, muted gray-green `#a4a69a`. Barlow Condensed for game headings and Barlow for body/utility text. Slanted rectangular primary controls, hairline dividers, generous open layouts, no dashboard-style card grid.

The generated concept was an internal art direction, not a user-approved fixed mockup. Intentional implementation differences: the decorative bottom HUD from the concept is moved into live gameplay; the unsupported decorative labels generated around the logo are omitted; the gameplay model style is deliberately faceted and simpler than the menu key art. Required selection, help, pause, training and result screens extend the same visual system.

Visual review compares menu layout, typography, palette, image framing, controls, spacing, and actual combat HUD at native desktop resolution and a narrow viewport. Screenshot evidence is written by the test scripts to the OS temporary directory, not shipped as game assets.
