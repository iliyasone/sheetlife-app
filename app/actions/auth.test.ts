import assert from "node:assert/strict";
import { initialAuthState } from "./auth-state";
import { requireCodeField, requireEmailField } from "./auth-validation";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
  {
    name: "initial auth state is blank and unauthenticated",
    run: () => {
      assert.equal(initialAuthState.ok, false);
      assert.equal(initialAuthState.message, "");
    },
  },
  {
    name: "requireEmailField rejects missing email",
    run: () => {
      const formData = new FormData();
      const result = requireEmailField(formData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.message, "Email is required.");
      }
    },
  },
  {
    name: "requireEmailField trims whitespace",
    run: () => {
      const formData = new FormData();
      formData.set("email", " alice@example.com   ");
      const result = requireEmailField(formData);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.value, "alice@example.com");
      }
    },
  },
  {
    name: "requireCodeField rejects blank code",
    run: () => {
      const formData = new FormData();
      formData.set("code", "   ");
      const result = requireCodeField(formData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.message, "Code is required.");
      }
    },
  },
  {
    name: "requireCodeField accepts alphanumeric code",
    run: () => {
      const formData = new FormData();
      formData.set("code", " 1234-ab ");
      const result = requireCodeField(formData);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.value, "1234-ab");
      }
    },
  },
];

let failures = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`✓ ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${test.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} auth tests passed.`);
}

