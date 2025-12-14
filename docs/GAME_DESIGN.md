# Booger Blaster - Game Design Document

## 1. Overview
**Booger Blaster** is a casual mobile action game where the player helps 5-year-old **Seungjae** defeat annoying bugs using his "secret weapon"—boogers. The game utilizes intuitive touch gestures (rubbing and flicking) to mimic the act of rolling and throwing a booger.

## 2. Character: Seungjae (승재)
- **Age**: 5 years old.
- **Appearance**: Casual sketch-style caricature. Mischievous grin, slightly messy hair.
- **Backstory**: Seungjae was peacefully mining his nose when a swarm of bugs appeared. Startled but determined, he decides to defend his territory.
- **Intro Sequence**: 
  1. Seungjae picking nose (idle).
  2. Bugs appear (shocked face).
  3. "Battle Mode" face (determined).

## 3. Controls & Input
The game is designed for Mobile/Tablet first, with PC fallback.

### Touch/Mouse Gestures
1.  **Pick & Rub (Charge)**:
    -   **Action**: Touch/Click and hold on the "nose" area, then move finger in small circular or rubbing motions.
    -   **Effect**: The "Booger" projectile spawns and grows in size (`Scale`).
    -   **Feedback**: Visual growth of the booger, squishy sound effects.
2.  **Flick (Shoot)**:
    -   **Action**: Rapid swipe gesture release from the rubbing position.
    -   **Effect**: Launches the booger.
    -   **Physics**: 
        -   **Speed**: Determined by flick velocity (delta distance / time).
        -   **Damage**: Determined by Booger Size + Speed.

### Failure State: Nosebleed
-   **Trigger**: Rubbing for too long (e.g., > 3 seconds) or rubbing too aggressively without shooting.
-   **Effect**: Seungjae gets a nosebleed. The current booger is lost. Input disabled briefly.

## 4. Gameplay Mechanics
-   **Enemies**:
    -   **Basic Fly**: Moves in straight lines or sine waves.
    -   **Fast Mosquito**: Harder to hit.
    -   **Tank Beetle**: Requires larger/faster boogers.
-   **Scoring**: Points for hitting bugs. Bonus for "Max Power" shots (Perfect Rub + Fast Flick).

## 5. Technical Constraints
-   **Platform**: Web (Mobile Browser optimized).
-   **Engine**: React + HTML5 Canvas (Ported logic from Unity design).
-   **Target FPS**: 60fps.
