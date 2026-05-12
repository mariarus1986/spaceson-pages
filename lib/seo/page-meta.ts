import type { PageContext } from "./types";

export function getPageTitle(context: PageContext): string {
  if (context.kind === "spaceType" && context.spaceType) {
    return `${context.spaceType.titlePlural} en ${context.city.name} | SpacesON`;
  }

  if (context.kind === "useCase" && context.useCase) {
    return `${context.useCase.title} en ${context.city.name} | Salas por horas`;
  }

  if (context.kind === "district" && context.district) {
    return `Alquiler de salas en ${context.district.name}, ${context.city.name} | SpacesON`;
  }

  return context.city.title;
}

export function getPageDescription(context: PageContext): string {
  if (context.kind === "spaceType" && context.spaceType) {
    return `Encuentra ${context.spaceType.titlePlural.toLowerCase()} en ${context.city.name}. Compara zonas, usos y enlaces relacionados para reservar mejor.`;
  }

  if (context.kind === "useCase" && context.useCase) {
    return `${context.useCase.description} Compara opciones en ${context.city.name} y zonas recomendadas.`;
  }

  if (context.kind === "district" && context.district) {
    return `${context.district.description} Explora salas por horas en ${context.district.name}, ${context.city.name}.`;
  }

  return context.city.description;
}
