import { ExtractAtomValue } from "jotai";
import { z } from "zod";

import { ZodFieldConfig, zodField } from "..";
import { ZodParams } from "../zod-field/zodParams";

export type DigitField = ReturnType<typeof digitField>;

export type DigitFieldValue = ExtractAtomValue<
  ExtractAtomValue<DigitField>["value"]
>;

const zodDigitSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
]);

type ZodDigitSchema = typeof zodDigitSchema;

export const digitField = ({
  ...config
}: Partial<ZodFieldConfig<ZodDigitSchema>> & ZodParams = {}) =>
  zodField({
    value: undefined,
    schema: zodDigitSchema,
    ...config,
  });
