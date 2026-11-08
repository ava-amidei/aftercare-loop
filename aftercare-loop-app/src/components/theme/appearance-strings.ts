/**
 * Local EN/ES strings for the appearance controls. Kept here (not in the
 * shared i18n dictionaries) because those files belong to other modules;
 * they can be moved into src/lib/i18n later without changing behaviour.
 */
import type { FontScale, Language } from "@/lib/types";
import type { AccentPresetId } from "@/lib/store/appearance";

export interface AppearanceStrings {
  sectionTitle: string;
  sectionDescription: string;
  accentLegend: string;
  accentHint: string;
  accentNames: Record<AccentPresetId, string>;
  defaultTag: string;
  fontLegend: string;
  fontNames: Record<FontScale, string>;
  fontHintFromA11y: string;
  previewLabel: string;
  previewTitle: string;
  previewBody: string;
  previewButton: string;
  resetAppearance: string;
  decreaseText: string;
  increaseText: string;
  textSizeGroup: string;
  textSizeNow: (size: string) => string;
}

const en: AppearanceStrings = {
  sectionTitle: "Appearance",
  sectionDescription: "Choose a color and text size that are comfortable for you. Saved for this fictional patient only.",
  accentLegend: "Accent color",
  accentHint: "Used for buttons, the active tab and highlights.",
  accentNames: {
    peach: "Peach",
    sand: "Sand",
    amber: "Amber",
    ember: "Ember",
    sage: "Sage",
    sky: "Sky",
    lavender: "Lavender",
  },
  defaultTag: "default",
  fontLegend: "Text size",
  fontNames: { sm: "Small", md: "Default", lg: "Large", xl: "Extra large" },
  fontHintFromA11y: "Following your “Larger text” accessibility preference.",
  previewLabel: "Preview",
  previewTitle: "Your next step",
  previewBody: "This is how cards, text and buttons will look across the app.",
  previewButton: "Sample button",
  resetAppearance: "Restore defaults",
  decreaseText: "Decrease text size",
  increaseText: "Increase text size",
  textSizeGroup: "Text size",
  textSizeNow: (size) => `Text size: ${size}`,
};

const es: AppearanceStrings = {
  sectionTitle: "Apariencia",
  sectionDescription: "Elija un color y un tamaño de texto cómodos para usted. Se guarda solo para este paciente ficticio.",
  accentLegend: "Color de acento",
  accentHint: "Se usa en botones, la pestaña activa y los resaltados.",
  accentNames: {
    peach: "Durazno",
    sand: "Arena",
    amber: "Ámbar",
    ember: "Brasa",
    sage: "Salvia",
    sky: "Cielo",
    lavender: "Lavanda",
  },
  defaultTag: "predeterminado",
  fontLegend: "Tamaño del texto",
  fontNames: { sm: "Pequeño", md: "Predeterminado", lg: "Grande", xl: "Muy grande" },
  fontHintFromA11y: "Según su preferencia de accesibilidad “Texto más grande”.",
  previewLabel: "Vista previa",
  previewTitle: "Su próximo paso",
  previewBody: "Así se verán las tarjetas, el texto y los botones en la aplicación.",
  previewButton: "Botón de ejemplo",
  resetAppearance: "Restablecer",
  decreaseText: "Reducir el tamaño del texto",
  increaseText: "Aumentar el tamaño del texto",
  textSizeGroup: "Tamaño del texto",
  textSizeNow: (size) => `Tamaño del texto: ${size}`,
};

export function appearanceStrings(lang: Language): AppearanceStrings {
  return lang === "es" ? es : en;
}
