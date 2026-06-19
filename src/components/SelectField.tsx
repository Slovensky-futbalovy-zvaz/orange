"use client";
import { Children, isValidElement } from "react";
import { CustomSelect } from "./CustomSelect";

interface SelectFieldProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
  className?: string;
}

export function SelectField({ value, onChange, children, className }: SelectFieldProps) {
  const options = Children.toArray(children)
    .filter((c): c is React.ReactElement<{ value?: string; children?: React.ReactNode }> =>
      isValidElement(c)
    )
    .map((c) => ({
      value: String(c.props.value ?? ""),
      label: String(c.props.children ?? ""),
    }));

  return (
    <CustomSelect
      value={value}
      onChange={(v) =>
        onChange({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)
      }
      options={options}
      className={className}
    />
  );
}
