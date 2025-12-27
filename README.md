# Story Matrix 🎞️

Story Matrix is a premium, high-performance photo gallery and storytelling platform. It allows users to organize their memories into **Stories**, customize them with **advanced animated text overlays**, and manage everything with a seamless **drag-and-drop** interface.

## ✨ Key Features

-   **Stories & Moments**: A refined terminology system where individual images represent "Moments" captured in a "Story".
-   **Seamless Drag & Drop**:
    -   Upload images directly from your computer or the web.
    -   Reorder Moments within a Story with intuitive handle-based dragging.
-   **Advanced Text Overlays**:
    -   **Dynamic Typewriter Effect**: Captions appear word-by-word with smooth timing.
    -   **⚡ Neon Sign Effect**: High-fidelity neon glow that matches your chosen font color, featuring **randomized flickering** across words for an organic, retro-sign feel.
    -   **💧 Drip Effect**: Sharp text with animated semi-transparent droplets falling from the letters.
    -   **Customize Everything**: Choose from premium fonts (Anton, Lobster, Pacifico, etc.), adjust sizes, and pick from a curated color palette.
-   **Smart Data Management**: 
    -   Automatic local storage persistence.
    -   Built-in **migration logic** to ensure backward compatibility with older "Album/Photo" data formats.
-   **Responsive Design**: Built with Tailwind CSS for a beautiful experience on both mobile and desktop.

## 🛠️ Technology Stack

-   **Frontend**: React + TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS + Custom CSS Keyframes
-   **Icons**: Lucide React

## 🚀 Getting Started

### Development

To run the project locally in development mode:

```bash
npm install
npm run dev
```

### Deployment

To deploy the application to GitHub Pages:

```bash
npm run deploy
```

## 📂 Project Structure

-   `App.tsx`: Central hub for state management, story mode, and the lightbox experience.
-   `components/`: Modular UI components like `MomentCard`, `StoryCard`, and `TypewriterText`.
-   `index.html`: Contains the advanced CSS animation engine for text effects.
-   `storage.ts`: Handles secure persistence of your stories and moments.

---
Built with passion for storytelling.
