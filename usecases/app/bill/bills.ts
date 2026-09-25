import { Bill } from "@tolokoban/bill";

export const BILLS: Bills = [
  {
    title: "Phase 1",
    currency: "CHF",
    rate: 50,
    hours: [
      ["Mise en place environnement de développement (Docker avec Apache, PHP8 et MariaDB)", 8],
      ["Backend REST avec authentification", 8],
      ["Notifications visuelles", 4],
      ["Gestion organisations et utilisateurs", 20],
    ],
  },
];

export type Bills = Array<
  Bill & {
    title: string;
  }
>;
