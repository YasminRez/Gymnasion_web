import { useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import "./FormField.css";

type CommonProps = { id: string; label: string; error?: string; hint?: string; selectPlaceholder?: string };
type FormFieldProps = CommonProps & (
  | ({ options?: never } & InputHTMLAttributes<HTMLInputElement>)
  | ({ options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>)
);

function FormField({ id, label, error, hint, selectPlaceholder = "Selecionar", ...props }: FormFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errorId = `${id}-error`;
  const accessibilityProps = {
    "aria-invalid": error ? true : props["aria-invalid"],
    "aria-errormessage": error ? errorId : props["aria-errormessage"],
    "aria-describedby": [props["aria-describedby"], error ? errorId : hint ? `${id}-hint` : undefined]
      .filter(Boolean).join(" ") || undefined,
  };

  const inputType = !props.options ? props.type : undefined;
  const isIdentifier =
    inputType === "email" ||
    inputType === "password" ||
    inputType === "search" ||
    props.name === "cpf" ||
    props.name === "phone" ||
    props.name === "email" ||
    props.name === "username";

  const defaultTextControlProps = isIdentifier
    ? {
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: false,
      }
    : {};

  return (
    <div
      className={`form-field${error ? " form-field--invalid" : ""}`}
    >
      <label htmlFor={id}>{label}</label>
      {props.options ? (
        <div className="form-field__select">
          {(() => {
            const { options, ...selectProps } = props;
            return (
              <select {...selectProps} {...accessibilityProps} id={id}>
                <option value="" disabled>{selectPlaceholder}</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            );
          })()}
        </div>
      ) : (
        props.type === "password" ? (
          <div className="form-field__password">
            <input
              {...defaultTextControlProps}
              {...props}
              {...accessibilityProps}
              id={id}
              type={passwordVisible ? "text" : "password"}
            />
            <button
              type="button"
              className="form-field__password-toggle"
              aria-label={`${passwordVisible ? "Ocultar" : "Mostrar"} senha: ${label}`}
              aria-controls={id}
              disabled={props.disabled}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {passwordVisible && <path d="m3 3 18 18" />}
              </svg>
            </button>
          </div>
        ) : (
          <input
            {...defaultTextControlProps}
            {...props}
            {...accessibilityProps}
            id={id}
          />
        )
      )}
      {!error && hint && <p className="form-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && (
        <p className="form-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
