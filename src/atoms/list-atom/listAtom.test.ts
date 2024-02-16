import { act, renderHook, waitFor } from "@testing-library/react";
import {
  FieldAtom,
  formAtom,
  useFieldActions,
  useFieldErrors,
  useFieldState,
  useFieldValue,
  useFormActions,
  useFormSubmit,
} from "form-atoms";
import { useAtomValue } from "jotai";
import { describe, expect, it, test, vi } from "vitest";

import { listAtom } from "./listAtom";
import { numberField, textField } from "../../fields";
import { useFieldError, useListActions, useListField } from "../../hooks";

describe("listAtom()", () => {
  test("can be submitted within formAtom", async () => {
    const nums = listAtom({
      value: [10, 20],
      builder: (value) => numberField({ value }),
    });

    const form = formAtom({ nums });

    const { result: submit } = renderHook(() => useFormSubmit(form));

    const onSubmit = vi.fn();

    await act(async () => submit.current(onSubmit)());

    expect(onSubmit).toHaveBeenCalledWith({ nums: [10, 20] });
  });

  describe("empty atom", () => {
    it("is true when values is empty array", () => {
      const list = listAtom({
        value: [],
        builder: ({ age }) => ({ age: numberField({ value: age }) }),
      });

      const { result } = renderHook(() =>
        useAtomValue(useAtomValue(list).empty),
      );

      expect(result.current).toBe(true);
    });

    it("is false when value contain data", () => {
      const list = listAtom({
        value: [{ age: 3 }],
        builder: ({ age }) => ({ age: numberField({ value: age }) }),
      });

      const { result } = renderHook(() =>
        useAtomValue(useAtomValue(list).empty),
      );

      expect(result.current).toBe(false);
    });
  });

  test("useFieldValue() reads list of object value", () => {
    const list = listAtom({
      value: [{ age: 80 }, { age: 70 }],
      builder: ({ age }) => ({ age: numberField({ value: age }) }),
    });

    const result = renderHook(() => useFieldValue(list));

    expect(result.result.current).toEqual([{ age: 80 }, { age: 70 }]);
  });

  test("useFieldValue() reads list of primitive value", () => {
    const list = listAtom({
      value: [10, 20, 30],
      builder: (age) => numberField({ value: age }),
    });

    const result = renderHook(() => useFieldValue(list));

    expect(result.result.current).toEqual([10, 20, 30]);
  });

  describe("resetting form", () => {
    test("the formActions.reset resets the field value", async () => {
      const ages = listAtom({
        value: [10],
        builder: (age) => numberField({ value: age }),
      });
      const form = formAtom({ ages });

      const { result: formActions } = renderHook(() => useFormActions(form));
      const { result: fieldActions } = renderHook(() => useFieldActions(ages));

      await act(async () => fieldActions.current.setValue([30]));
      const onSubmit = vi.fn();
      await act(async () => formActions.current.submit(onSubmit)());
      expect(onSubmit).toHaveBeenCalledWith({ ages: [30] });

      await act(async () => formActions.current.reset());

      const reset_onSubmit = vi.fn();
      await act(async () => formActions.current.submit(reset_onSubmit)());
      expect(reset_onSubmit).toHaveBeenCalledWith({ ages: [10] });
    });

    test("the formActions.reset resets the field error", async () => {
      const ages = listAtom({
        value: [],
        builder: (age) => numberField({ value: age }),
        validate: () => ["err"],
      });
      const form = formAtom({ ages });

      const { result: formActions } = renderHook(() => useFormActions(form));
      const { result: fieldError } = renderHook(() => useFieldError(ages));

      const onSubmit = vi.fn();
      await act(async () => formActions.current.submit(onSubmit)());

      expect(fieldError.current.error).not.toBe(undefined);

      await act(async () => formActions.current.reset());

      expect(fieldError.current.error).toBe(undefined);
    });
  });

  describe("validation", () => {
    it("adding item clear the error", async () => {
      const field = listAtom({
        value: [],
        builder: (value) => numberField({ value }),
        validate: ({ value }) => {
          const errors = [];
          if (value.length === 0) {
            errors.push("Can't be empty");
          }
          return errors;
        },
      });

      const { result: actions } = renderHook(() => useFieldActions(field));
      const { result: errors } = renderHook(() => useFieldErrors(field));

      await act(async () => actions.current.validate());

      expect(errors.current).toEqual(["Can't be empty"]);

      const { result: listActions } = renderHook(() => useListActions(field));

      await act(async () => listActions.current.add());

      expect(errors.current).toEqual([]);
    });

    it("validates the inner form items", async () => {
      const field = listAtom({
        value: [undefined],
        invalidItemError: "err",
        builder: (value) => numberField({ value }),
      });

      const { result: actions } = renderHook(() => useFieldActions(field));
      const { result: errors } = renderHook(() => useFieldErrors(field));

      await act(async () => actions.current.validate());

      expect(errors.current).toEqual(["err"]);
    });
  });

  describe("nested validation", () => {
    it("can't be submitted with invalid item's field", async () => {
      const field = listAtom({
        value: [undefined], // empty value for number
        builder: (value) => numberField({ value }),
      });

      const form = formAtom({ field });

      const { result: submit } = renderHook(() => useFormSubmit(form));
      const onSubmit = vi.fn();
      await act(async () => submit.current(onSubmit)());

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("can't be submitted when item of nested list is invalid", async () => {
      const field = listAtom({
        name: "users",
        value: [{ accounts: [undefined] }],
        builder: ({ accounts }) => ({
          accounts: listAtom({
            name: "bank-accounts",
            value: accounts,
            builder: (iban) => textField({ name: "iban", value: iban }),
          }),
        }),
      });

      const form = formAtom({ field });

      const { result: submit } = renderHook(() => useFormSubmit(form));
      const onSubmit = vi.fn();
      await act(async () => submit.current(onSubmit)());

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("has the invalidItemError, when item of nested list is invalid", async () => {
      const field = listAtom({
        invalidItemError: "There are some errors",
        value: [undefined], // empty value for a required number will cause error
        builder: (value) => numberField({ value }),
      });

      const form = formAtom({ field });

      const { result: submit } = renderHook(() => useFormSubmit(form));
      const { result: fieldError } = renderHook(() => useFieldError(field));

      await act(async () => submit.current(vi.fn())());

      expect(fieldError.current.error).toBe("There are some errors");
    });

    it("should lose invalidItemError, when the nested item error is fixed", async () => {
      const field = listAtom({
        value: [undefined], // empty value for a required number will cause error
        builder: (value) => numberField({ value }),
      });

      const form = formAtom({ field });

      const { result: submit } = renderHook(() => useFormSubmit(form));
      const { result: fieldError } = renderHook(() => useFieldError(field));
      const { result: formFields } = renderHook(() =>
        useAtomValue(useAtomValue(field)._formFields),
      );

      const { result: inputActions } = renderHook(() =>
        useFieldActions(formFields.current[0]!),
      );

      expect(fieldError.current.error).toBe(undefined);

      await act(async () => submit.current(vi.fn())());

      expect(fieldError.current.error).toBe("Some list items contain errors.");

      await act(async () => inputActions.current.setValue(5));

      expect(fieldError.current.error).toBe(undefined);
    });
  });

  describe("dirty", () => {
    it("becomes dirty when an item is removed", async () => {
      const field = listAtom({
        value: [42],
        builder: (value) => numberField({ value }),
      });

      const { result: state } = renderHook(() => useFieldState(field));
      const { result: listActions } = renderHook(() => useListActions(field));
      const { result: list } = renderHook(() =>
        useAtomValue(useAtomValue(field)._splitList),
      );
      expect(state.current.dirty).toBe(false);

      await act(async () => listActions.current.remove(list.current[0]!));
      expect(state.current.dirty).toBe(true);
    });

    it("becomes dirty when an item is added", async () => {
      const field = listAtom({
        value: [],
        builder: (value) => numberField({ value }),
      });

      const { result: state } = renderHook(() => useFieldState(field));
      const { result: listActions } = renderHook(() => useListActions(field));

      expect(state.current.dirty).toBe(false);

      await act(async () => listActions.current.add());
      expect(state.current.dirty).toBe(true);
    });

    it("becomes dirty when items are reordered", async () => {
      const field = listAtom({
        value: [42, 84],
        builder: (value) => numberField({ value }),
      });

      const { result: state } = renderHook(() => useFieldState(field));
      const { result: listActions } = renderHook(() => useListActions(field));
      const { result: list } = renderHook(() =>
        useAtomValue(useAtomValue(field)._splitList),
      );
      expect(state.current.dirty).toBe(false);

      await act(async () => listActions.current.move(list.current[0]!));
      expect(state.current.dirty).toBe(true);
    });

    it("becomes dirty when some item field is edited", async () => {
      const field = listAtom({
        value: [undefined],
        builder: (value) => numberField({ value }),
      });

      const { result: fieldState } = renderHook(() => useFieldState(field));
      const { result: formFields } = renderHook(() =>
        useAtomValue(useAtomValue(field)._formFields),
      );
      const { result: inputActions } = renderHook(() =>
        useFieldActions(formFields.current[0]!),
      );

      expect(fieldState.current.dirty).toBe(false);

      await act(async () => inputActions.current.setValue(42));
      expect(fieldState.current.dirty).toBe(true);

      await act(async () => inputActions.current.reset());
      expect(fieldState.current.dirty).toBe(false);
    });

    it("becomes pristine when items are reordered & back", async () => {
      const field = listAtom({
        value: [42, 84],
        builder: (value) => numberField({ value }),
      });

      const { result: state } = renderHook(() => useFieldState(field));
      const { result: listActions } = renderHook(() => useListActions(field));
      const { result: list } = renderHook(() =>
        useAtomValue(useAtomValue(field)._splitList),
      );
      expect(state.current.dirty).toBe(false);

      // moves first item down
      await act(async () => listActions.current.move(list.current[0]!));
      expect(state.current.dirty).toBe(true);

      // moves first item down
      await act(async () => listActions.current.move(list.current[0]!));
      expect(state.current.dirty).toBe(false);
    });

    it("becomes pristine after value is set (the set is usually called by useFieldInitialValue to hydrate the field)", async () => {
      const field = listAtom({
        value: [1, 2],
        builder: (value) => numberField({ value }),
      });

      const { result: state } = renderHook(() => useFieldState(field));
      const { result: fieldActions } = renderHook(() => useFieldActions(field));

      // make list dirty
      const { result: listActions } = renderHook(() => useListActions(field));
      await act(async () => listActions.current.add());
      expect(state.current.dirty).toBe(true);

      await act(async () => fieldActions.current.setValue([42, 84]));
      expect(state.current.dirty).toBe(false);
    });
  });

  describe("scoped name of list fields", () => {
    const useFieldName = <T extends FieldAtom<any>>(fieldAtom: T) =>
      useAtomValue(useAtomValue(fieldAtom).name);

    describe("list of primitive fieldAtoms", () => {
      it("field name contains list name and index", async () => {
        const field = listAtom({
          name: "recipients",
          value: ["foo@bar.com", "fizz@buzz.com"],
          builder: (value) => textField({ value }),
        });

        const { result: list } = renderHook(() => useListField(field));
        const { result: names } = renderHook(() => [
          useFieldName(list.current.items[0]!.fields),
          useFieldName(list.current.items[1]!.fields),
        ]);

        await waitFor(() => Promise.resolve());

        expect(names.current).toEqual(["recipients[0]", "recipients[1]"]);
      });

      it("updates the index for current value, when moved in the list", async () => {
        const field = listAtom({
          name: "recipients",
          value: ["foo@bar.com", "fizz@buzz.com"],
          builder: (value) => textField({ value }),
        });

        const { result: list } = renderHook(() => useListField(field));
        const { result: values } = renderHook(() => [
          useFieldValue(list.current.items[0]!.fields),
          useFieldName(list.current.items[0]!.fields),
          useFieldValue(list.current.items[1]!.fields),
          useFieldName(list.current.items[1]!.fields),
        ]);
        const { result: listItems } = renderHook(() =>
          useAtomValue(useAtomValue(field)._splitList),
        );

        await waitFor(() => Promise.resolve());

        expect(values.current).toEqual([
          "foo@bar.com",
          "recipients[0]",
          "fizz@buzz.com",
          "recipients[1]",
        ]);

        const { result: listActions } = renderHook(() => useListActions(field));

        // moves first item down
        await act(async () => listActions.current.move(listItems.current[0]!));

        expect(values.current).toEqual([
          "fizz@buzz.com",
          "recipients[0]",
          "foo@bar.com",
          "recipients[1]",
        ]);
      });
    });

    describe("list of form fields", () => {
      it("field name contains list name, index and field name", async () => {
        const field = listAtom({
          name: "contacts",
          value: [{ email: "foo@bar.com" }, { email: "fizz@buzz.com" }],
          builder: ({ email }) => ({
            email: textField({ value: email, name: "email" }),
          }),
        });

        const { result: list } = renderHook(() => useListField(field));
        const { result: names } = renderHook(() => [
          useFieldName(list.current.items[0]!.fields.email),
          useFieldName(list.current.items[1]!.fields.email),
        ]);

        await waitFor(() => Promise.resolve());

        expect(names.current).toEqual([
          "contacts[0].email",
          "contacts[1].email",
        ]);
      });
    });

    describe("nested listAtom", () => {
      // passes but throws error
      it.skip("has prefix of the parent listAtom", async () => {
        const field = listAtom({
          name: "contacts",
          value: [
            {
              email: "foo@bar.com",
              addresses: [{ type: "home", city: "Kezmarok" }],
            },
            {
              email: "fizz@buzz.com",
              addresses: [
                { type: "home", city: "Humenne" },
                { type: "work", city: "Nove Zamky" },
              ],
            },
          ],
          builder: ({ email, addresses = [] }) => ({
            email: textField({ value: email, name: "email" }),
            addresses: listAtom({
              name: "addresses",
              value: addresses,
              builder: ({ type, city }) => ({
                type: textField({ value: type, name: "type" }),
                city: textField({ value: city, name: "city" }),
              }),
            }),
          }),
        });

        const { result: list } = renderHook(() => useListField(field));
        const { result: secondContactAddresses } = renderHook(() =>
          useListField(list.current.items[1]!.fields.addresses),
        );

        const { result: names } = renderHook(() => [
          useFieldName(secondContactAddresses.current.items[0]!.fields.type),
          useFieldName(secondContactAddresses.current.items[0]!.fields.city),
          useFieldName(secondContactAddresses.current.items[1]!.fields.type),
          useFieldName(secondContactAddresses.current.items[1]!.fields.city),
        ]);

        await waitFor(() => Promise.resolve());

        expect(names.current).toEqual([
          "contacts[1].addresses[0].type",
          "contacts[1].addresses[0].city",
          "contacts[1].addresses[1].type",
          "contacts[1].addresses[1].city",
        ]);
      });
    });
  });
});
