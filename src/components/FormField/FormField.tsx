import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import "./FormField.css";

type CommonProps = { id: string; label: string };
type FormFieldProps = CommonProps & (
  | ({ options?: never } & InputHTMLAttributes<HTMLInputElement>)
  | ({ options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>)
);

function FormField({ id, label, ...props }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {props.options ? (
        <div className="form-field__select">
          {(() => {
            const { options, ...selectProps } = props;
            return (
              <select {...selectProps} id={id}>
                <option value="" disabled>Selecionar</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            );
          })()}
        </div>
      ) : (
        <input {...props} id={id} />
      )}
    </div>
  );
}

export default FormField;
