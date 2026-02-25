import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders retro todo title and input", () => {
  render(<App />);
  expect(screen.getByText(/retro to‑do/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/type a task/i)).toBeInTheDocument();
});
