import { render, renderHook, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import { EMPTY_SELECT_VALUE, useSelectFieldProps } from "./useSelectFieldProps";
import { StringField, stringField } from "../../fields";

describe("useSelectFieldProps()", () => {
  const props = {
    options: ["alfa", "bravo", "charlie"],
    getValue: (val: string) => val,
  };

  it("initializes field via options", () => {
    const field = stringField();
    const index = 2;

    const { result } = renderHook(() =>
      useSelectFieldProps(
        { field, ...props },
        { initialValue: props.options[index] },
      ),
    );

    expect(result.current.value).toBe(index);
  });

  describe("initial value", () => {
    it("is -1 when field is empty", () => {
      const field = stringField();

      const { result } = renderHook(() =>
        useSelectFieldProps({ field, ...props }),
      );

      expect(result.current.value).toBe(-1);
    });

    it("is option index of current field value", () => {
      const field = stringField({ value: "bravo" });
      const { result } = renderHook(() =>
        useSelectFieldProps({
          field,
          ...props,
        }),
      );

      expect(result.current.value).toBe(1);
    });
  });

  describe("changing value", () => {
    describe("with html options indexed as the options prop", () => {
      it("should have the option index as value", async () => {
        const field = stringField();

        render(
          <DummySelect field={field} options={props.options}>
            {props.options.map((val, index) => (
              <option key={val} value={index}>
                {val}
              </option>
            ))}
          </DummySelect>,
        );

        await userEvent.selectOptions(screen.getByRole("combobox"), [
          screen.getByText("charlie"),
        ]);

        expect(screen.getByRole("combobox")).toHaveValue("2");
      });
    });

    describe("with option value out of bounds", () => {
      it("should reset to empty value", async () => {
        const field = stringField();

        /* Purposefuly invalid select, with value out-of-bounds as to demonstrate a case
          where somebody would index manually instead of using the useSelectOptions hook  */
        render(
          <DummySelect field={field}>
            <option value="9999">custom</option>
          </DummySelect>,
        );

        await userEvent.selectOptions(screen.getByRole("combobox"), [
          screen.getByText("custom"),
        ]);

        expect(screen.getByRole("combobox")).toHaveValue("-1");
      });
    });
  });
});

const DummySelect = ({
  field,
  options = [],
  children,
}: PropsWithChildren<{ options?: string[]; field: StringField }>) => {
  const props = useSelectFieldProps({
    field,
    options,
    getValue: (opt) => opt,
  });

  return (
    <select {...props}>
      <option value={EMPTY_SELECT_VALUE}>placeholder</option>
      {children}
    </select>
  );
};
