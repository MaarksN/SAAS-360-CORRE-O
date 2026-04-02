import { readFile } from "node:fs/promises";

import { schemaPath } from "./paths.js";

export interface ParsedField {
  attributes: string;
  isArray: boolean;
  isOptional: boolean;
  isRelation: boolean;
  mappedName: string;
  name: string;
  raw: string;
  relationFields: string[];
  type: string;
}

export interface ParsedModel {
  fields: ParsedField[];
  indexes: string[][];
  mappedName: string;
  name: string;
  primaryKey: string[];
  raw: string;
  uniques: string[][];
}

function splitFieldList(rawList: string): string[] {
  return rawList
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^([A-Za-z0-9_]+)/);
      return match ? match[1] : item;
    })
    .filter((item): item is string => Boolean(item));
}

function parseModelLevelFields(rawBlock: string, attribute: "@@id" | "@@index" | "@@unique"): string[][] {
  const expression = new RegExp(`${attribute}\\(\\[([^\\]]+)\\]`, "g");
  const fields: string[][] = [];

  for (const match of rawBlock.matchAll(expression)) {
    const fieldList = match[1];

    if (!fieldList) {
      continue;
    }

    fields.push(splitFieldList(fieldList));
  }

  return fields;
}

export async function parsePrismaSchema(): Promise<ParsedModel[]> {
  const schema = await readFile(schemaPath, "utf8");
  const modelNames = Array.from(
    schema.matchAll(/^model\s+(\w+)\s+\{/gm),
    (match) => match[1]
  ).filter((modelName): modelName is string => Boolean(modelName));
  const modelNameSet = new Set(modelNames);
  const models: ParsedModel[] = [];
  const modelExpression = /^model\s+(\w+)\s+\{([\s\S]*?)^\}/gm;

  for (const match of schema.matchAll(modelExpression)) {
    const name = match[1];
    const raw = match[2];

    if (!name || raw === undefined) {
      continue;
    }

    const mappedNameMatch = raw.match(/@@map\("([^"]+)"\)/);
    const mappedName = mappedNameMatch?.[1] ?? name;
    const fields: ParsedField[] = [];

    for (const rawLine of raw.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("//") || line.startsWith("@@")) {
        continue;
      }

      const fieldMatch = line.match(/^(\w+)\s+([^\s]+)(.*)$/);

      if (!fieldMatch) {
        continue;
      }

      const fieldName = fieldMatch[1];
      const rawType = fieldMatch[2];
      const attributes = fieldMatch[3] ?? "";

      if (!fieldName || !rawType) {
        continue;
      }

      const normalizedType = rawType.replace(/\?$/, "").replace(/\[\]$/, "");
      const mappedFieldMatch = attributes.match(/@map\("([^"]+)"\)/);
      const relationFieldsMatch = attributes.match(/@relation\((?:[^)]*?)fields:\s*\[([^\]]+)\]/);
      const relationFieldsRaw = relationFieldsMatch?.[1];

      fields.push({
        attributes,
        isArray: rawType.endsWith("[]"),
        isOptional: rawType.endsWith("?"),
        isRelation: modelNameSet.has(normalizedType),
        mappedName: mappedFieldMatch?.[1] ?? fieldName,
        name: fieldName,
        raw: line,
        relationFields: relationFieldsRaw ? splitFieldList(relationFieldsRaw) : [],
        type: normalizedType
      });
    }

    models.push({
      fields,
      indexes: parseModelLevelFields(raw, "@@index"),
      mappedName,
      name,
      primaryKey:
        parseModelLevelFields(raw, "@@id")[0] ??
        fields.filter((field) => field.attributes.includes("@id")).map((field) => field.name),
      raw,
      uniques: [
        ...parseModelLevelFields(raw, "@@unique"),
        ...fields.filter((field) => field.attributes.includes("@unique")).map((field) => [field.name])
      ]
    });
  }

  return models;
}

export function getTenantScopedModels(models: ParsedModel[]): ParsedModel[] {
  return models.filter((model) => model.fields.some((field) => field.name === "tenantId"));
}

export function hasIndexCoverage(model: ParsedModel, fields: string[]): boolean {
  if (fields.length === 0) {
    return true;
  }

  const candidateIndexes = [...model.indexes, ...model.uniques, model.primaryKey];
  const matchesPrefix = (indexFields: string[], expected: string[]): boolean => {
    if (indexFields.length < expected.length) {
      return false;
    }

    return expected.every((field, index) => indexFields[index] === field);
  };

  return candidateIndexes.some((indexFields) => {
    if (matchesPrefix(indexFields, fields)) {
      return true;
    }

    if (model.fields.some((field) => field.name === "tenantId")) {
      return matchesPrefix(indexFields, ["tenantId", ...fields]);
    }

    return false;
  });
}
