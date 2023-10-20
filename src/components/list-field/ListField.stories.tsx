import { InputField, fieldAtom, formAtom } from "form-atoms";

import {
  AddItemButtonProps,
  ListField,
  RemoveItemButtonProps,
} from "./ListField";
import { checkboxField } from "../../fields/checkbox-field";
import { FieldLabel } from "../field-label";
import { Radio, RadioControl } from "../radio";
import { formStory, meta } from "../../scenarios/StoryForm";

export default {
  ...meta,
  title: "components/ListField",
};

export const Primary = formStory({
  parameters: {
    docs: {
      description: {
        story:
          "The array field enables you to capture list of items with the same attributes. It offers `add` and `remove` callbacks to append new item or drop existing one.",
      },
    },
  },
  args: {
    fields: {
      envVars: [
        {
          name: fieldAtom({ value: "API_KEY" }),
          value: fieldAtom({ value: "ff52d09a" }),
        },
      ],
    },
    children: ({ form }) => (
      <ListField
        form={form}
        path={["envVars"]}
        keyFrom="name"
        builder={() => ({
          name: fieldAtom({ value: "" }),
          value: fieldAtom({ value: "" }),
        })}
        AddItemButton={({ add }) => (
          <button type="button" className="outline" onClick={add}>
            Add environment variable
          </button>
        )}
        RemoveItemButton={RemoveButton}
      >
        {({ fields, RemoveItemButton }) => (
          <div
            style={{
              display: "grid",
              gridGap: 16,
              gridTemplateColumns: "auto auto min-content",
            }}
          >
            <InputField
              atom={fields.name}
              render={(props) => <input {...props} placeholder="Name" />}
            />
            <InputField
              atom={fields.value}
              render={(props) => <input {...props} placeholder="Value" />}
            />
            <RemoveItemButton />
          </div>
        )}
      </ListField>
    ),
  },
});

export const Flat = formStory({
  parameters: {
    docs: {
      description: {
        story:
          "The array items can be plain field atoms. This is usefull when you want to capture list of primitives, e.g. strings or numbers. Here our hobbies list contains `FieldAtom<string>` items.",
      },
    },
  },
  args: {
    fields: {
      hobbies: [fieldAtom({ value: "gardening" })],
    },
    children: ({ form }) => (
      <ListField
        form={form}
        path={["hobbies"]}
        AddItemButton={AddHobbyField}
        RemoveItemButton={RemoveButton}
        builder={() => fieldAtom({ value: "" })}
      >
        {({ fields, RemoveItemButton }) => (
          <div
            style={{
              display: "grid",
              gridGap: 16,
              gridTemplateColumns: "auto min-content",
            }}
          >
            <InputField atom={fields} component="input" />
            <RemoveItemButton />
          </div>
        )}
      </ListField>
    ),
  },
});

export const Nested = formStory({
  args: {
    fields: {
      people: [
        {
          name: fieldAtom({ value: "Jerry" }),
          accounts: [{ iban: fieldAtom({ value: "DE10 ..." }) }],
        },
      ],
    },
    children: ({ form }) => (
      <ListField
        form={form}
        keyFrom="name"
        path={["people"]}
        builder={() => ({
          name: fieldAtom({ value: "" }),
          accounts: [],
        })}
        AddItemButton={({ add }) => (
          <button type="button" className="outline" onClick={add}>
            Add Person
          </button>
        )}
        RemoveItemButton={RemoveButton}
      >
        {({ fields, index, RemoveItemButton }) => (
          <>
            <div
              style={{
                display: "grid",
                gridGap: 16,
                gridTemplateColumns: "auto min-content",
              }}
            >
              <label>Person #{index + 1}</label> <RemoveItemButton />
            </div>
            <InputField
              atom={fields.name}
              render={(props) => <input {...props} placeholder="Name" />}
            />
            <ListField
              form={form}
              keyFrom="iban"
              path={["people", index, "accounts"]}
              builder={() => ({ iban: fieldAtom({ value: "" }) })}
              AddItemButton={({ add }) => (
                <button type="button" className="outline" onClick={add}>
                  Add Bank Account
                </button>
              )}
              RemoveItemButton={RemoveButton}
            >
              {({ fields, index, RemoveItemButton }) => (
                <div style={{ marginLeft: 48 }}>
                  <label>Account #{index + 1}</label>
                  <div
                    style={{
                      display: "grid",
                      gridGap: 16,
                      gridTemplateColumns: "auto min-content",
                    }}
                  >
                    <InputField
                      atom={fields.iban}
                      render={(props) => (
                        <input {...props} placeholder="IBAN" />
                      )}
                    />
                    <RemoveItemButton />
                  </div>
                </div>
              )}
            </ListField>
          </>
        )}
      </ListField>
    ),
  },
});

export const WithRadioControl = formStory({
  args: {
    fields: {
      phones: [
        {
          number: fieldAtom({ value: "+421 200 300 500" }),
          isPrimary: checkboxField({
            name: "primaryPhone",
            value: true,
          }).optional(),
        },
      ],
    },
    children: ({ form }) => (
      <RadioControl>
        {({ control }) => (
          <ListField
            form={form}
            path={["phones"]}
            keyFrom="number"
            builder={() => ({
              number: fieldAtom({ value: "" }),
              isPrimary: checkboxField({ name: "primaryPhone" }).optional(),
            })}
            AddItemButton={({ add }) => (
              <button type="button" className="outline" onClick={add}>
                Add contact phone
              </button>
            )}
            RemoveItemButton={RemoveButton}
          >
            {({ fields, RemoveItemButton }) => (
              <>
                <div
                  style={{
                    display: "grid",
                    gridGap: 16,
                    gridTemplateColumns: "auto min-content",
                  }}
                >
                  <InputField
                    atom={fields.number}
                    render={(props) => (
                      <input
                        {...props}
                        placeholder="Phone number in format +421 xxx xxx xxx"
                      />
                    )}
                  />

                  <RemoveItemButton />
                </div>
                <Radio control={control} field={fields.isPrimary}>
                  {(props) => (
                    <div style={{ marginBottom: 40 }}>
                      <input
                        {...props}
                        type="radio"
                        id={`${fields.isPrimary}`}
                      />
                      <FieldLabel
                        label="Primary, receive 2FA SMS on this phone."
                        field={fields.isPrimary}
                      />
                    </div>
                  )}
                </Radio>
              </>
            )}
          </ListField>
        )}
      </RadioControl>
    ),
  },
});

// This is a button that immutably pushes a new field atom to the hobbies array
const AddHobbyField = ({ add }: AddItemButtonProps) => (
  <button type="button" className="outline" onClick={add}>
    Add hobby
  </button>
);

// This is a button that removes current field atom from the hobbies array
const RemoveButton = ({ remove }: RemoveItemButtonProps) => (
  <button type="button" className="outline secondary" onClick={remove}>
    Remove
  </button>
);
