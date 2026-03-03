import { getName } from "@/lib/webhook/customer-created";
import {
  extractUserFields,
  fieldsArrayToMap,
  getFirstAvailableField,
  isCompoundNameField,
} from "@/lib/webhook/custom";
import { describe, expect, test } from "vitest";

describe("isCompoundNameField", () => {
  test("French with 'et': Prénom et nom", () => {
    expect(isCompoundNameField("Prénom et nom")).toBe(true);
  });

  test("French without conjunction: Prénom Nom", () => {
    expect(isCompoundNameField("Prénom Nom")).toBe(true);
  });

  test("French inverse: Nom et Prénom", () => {
    expect(isCompoundNameField("Nom et Prénom")).toBe(true);
  });

  test("French with ampersand: Prénom & Nom", () => {
    expect(isCompoundNameField("Prénom & Nom")).toBe(true);
  });

  test("English: First name and last name", () => {
    expect(isCompoundNameField("First name and last name")).toBe(true);
  });

  test("slug: nom_et_prenom", () => {
    expect(isCompoundNameField("nom_et_prenom")).toBe(true);
  });

  test("slug underscore: first_name_last_name", () => {
    expect(isCompoundNameField("first_name_last_name")).toBe(true);
  });

  test("slug hyphen: prenom-nom", () => {
    expect(isCompoundNameField("prenom-nom")).toBe(true);
  });

  test("slug with slash: Prénom / Nom", () => {
    expect(isCompoundNameField("Prénom / Nom")).toBe(true);
  });

  test("excluded: single concept - Nom complet", () => {
    expect(isCompoundNameField("Nom complet")).toBe(false);
  });

  test("excluded: other combination - Name and email", () => {
    expect(isCompoundNameField("Name and email")).toBe(false);
  });

  test("excluded: ambiguous - nom", () => {
    expect(isCompoundNameField("nom")).toBe(false);
  });

  test("excluded: single - prenom", () => {
    expect(isCompoundNameField("prenom")).toBe(false);
  });

  test("excluded: single - firstname", () => {
    expect(isCompoundNameField("firstname")).toBe(false);
  });

  test("excluded: empty string", () => {
    expect(isCompoundNameField("")).toBe(false);
  });

  test("excluded: whitespace only", () => {
    expect(isCompoundNameField("   ")).toBe(false);
  });

  test("slug: nom_prenom (inverse order)", () => {
    expect(isCompoundNameField("nom_prenom")).toBe(true);
  });

  test("slug: prenom_nom", () => {
    expect(isCompoundNameField("prenom_nom")).toBe(true);
  });

  test("with comma: Nom, Prénom", () => {
    expect(isCompoundNameField("Nom, Prénom")).toBe(true);
  });

  test("excluded: Full name (single concept)", () => {
    expect(isCompoundNameField("Full name")).toBe(false);
  });

  test("excluded: surname alone", () => {
    expect(isCompoundNameField("surname")).toBe(false);
  });

  test("excluded: lastname alone", () => {
    expect(isCompoundNameField("lastname")).toBe(false);
  });

  test("excluded: Company name", () => {
    expect(isCompoundNameField("Company name")).toBe(false);
  });

  test("excluded: Your name", () => {
    expect(isCompoundNameField("Your name")).toBe(false);
  });

  test("excluded: Name (single word)", () => {
    expect(isCompoundNameField("Name")).toBe(false);
  });

  test("excluded: field_123 (generic slug)", () => {
    expect(isCompoundNameField("field_123")).toBe(false);
  });

  test("case insensitive: PRÉNOM ET NOM", () => {
    expect(isCompoundNameField("PRÉNOM ET NOM")).toBe(true);
  });

  test("surname in compound: First and Surname", () => {
    expect(isCompoundNameField("First and Surname")).toBe(true);
  });

  test("excluded: Phone number", () => {
    expect(isCompoundNameField("Phone number")).toBe(false);
  });

  test("excluded: Last update", () => {
    expect(isCompoundNameField("Last update")).toBe(false);
  });

  test("excluded: First choice", () => {
    expect(isCompoundNameField("First choice")).toBe(false);
  });
});

describe("fieldsArrayToMap", () => {
  test("label only: maps label to value", () => {
    const result = fieldsArrayToMap([
      { label: "Nom et prénom", value: "Jean Dupont" },
    ]);
    expect(result).toEqual({ "Nom et prénom": "Jean Dupont" });
  });

  test("key only (slug): map contains key when no label", () => {
    const result = fieldsArrayToMap([
      { key: "nom_et_prenom", value: "Jean Dupont" },
    ]);
    expect(result).toHaveProperty("nom_et_prenom", "Jean Dupont");
  });

  test("label + key: both keys point to value", () => {
    const result = fieldsArrayToMap([
      {
        label: "Nom et prénom",
        key: "q1",
        value: "Jean Dupont",
      },
    ]);
    expect(result["Nom et prénom"]).toBe("Jean Dupont");
    expect(result["q1"]).toBe("Jean Dupont");
  });

  test("skips field without value", () => {
    const result = fieldsArrayToMap([
      { label: "Nom et prénom", value: null },
      { label: "Email", value: "a@b.fr" },
    ]);
    expect(result).not.toHaveProperty("Nom et prénom");
    expect(result["Email"]).toBe("a@b.fr");
  });

  test("skips field with undefined value", () => {
    const result = fieldsArrayToMap([
      { label: "Name", value: undefined },
      { label: "Email", value: "a@b.fr" },
    ]);
    expect(result).not.toHaveProperty("Name");
    expect(result["Email"]).toBe("a@b.fr");
  });

  test("empty array returns empty object", () => {
    expect(fieldsArrayToMap([])).toEqual({});
  });

  test("includes value 0", () => {
    const result = fieldsArrayToMap([{ label: "Count", value: 0 }]);
    expect(result["Count"]).toBe(0);
  });

  test("includes empty string value", () => {
    const result = fieldsArrayToMap([{ label: "Notes", value: "" }]);
    expect(result["Notes"]).toBe("");
  });

  test("skips field with no label and no key", () => {
    const result = fieldsArrayToMap([{ value: "orphan" }]);
    expect(result).toEqual({});
  });

  test("label and key same: single entry", () => {
    const result = fieldsArrayToMap([
      { label: "Email", key: "Email", value: "a@b.fr" },
    ]);
    expect(result["Email"]).toBe("a@b.fr");
  });

  test("multiple fields with different structures", () => {
    const result = fieldsArrayToMap([
      { label: "Name", value: "Jean" },
      { key: "email", value: "a@b.fr" },
      { label: "Age", key: "q3", value: 25 },
    ]);
    expect(result["Name"]).toBe("Jean");
    expect(result["email"]).toBe("a@b.fr");
    expect(result["Age"]).toBe(25);
    expect(result["q3"]).toBe(25);
  });

  test("field with boolean value", () => {
    const result = fieldsArrayToMap([{ label: "OptIn", value: true }]);
    expect(result["OptIn"]).toBe(true);
  });

  test("field with object value", () => {
    const val = { nested: "data" };
    const result = fieldsArrayToMap([{ label: "Meta", value: val }]);
    expect(result["Meta"]).toEqual(val);
  });

  test("Tally-style field with key and label", () => {
    const result = fieldsArrayToMap([
      {
        key: "question_abc123",
        label: "Prénom et nom",
        type: "INPUT_TEXT",
        value: "Jean Dupont",
      },
    ]);
    expect(result["Prénom et nom"]).toBe("Jean Dupont");
    expect(result["question_abc123"]).toBe("Jean Dupont");
  });
});

describe("getFirstAvailableField", () => {
  test("empty data returns null", () => {
    expect(getFirstAvailableField({}, ["email"], true)).toBeNull();
  });

  test("exact match without prefix", () => {
    expect(
      getFirstAvailableField({ email: "a@b.fr" }, ["email"], false),
    ).toBe("a@b.fr");
  });

  test("word boundary: nom does not match prenom", () => {
    expect(
      getFirstAvailableField(
        { Prénom: "Jean", Nom: "Dupont" },
        ["nom"],
        true,
      ),
    ).toBe("Dupont");
  });

  test("excludes compound field when flag set: only compound returns null", () => {
    const data = { "Prénom et nom": "Jean Dupont", Email: "a@b.fr" };
    expect(
      getFirstAvailableField(data, ["prenom"], true, true),
    ).toBeNull();
  });

  test("compound field excluded returns separate field when both exist", () => {
    const data = {
      "Prénom et nom": "Jean Dupont",
      Prénom: "Jean",
      Nom: "Dupont",
    };
    expect(
      getFirstAvailableField(data, ["prenom"], true, true),
    ).toBe("Jean");
    expect(
      getFirstAvailableField(data, ["nom"], true, true),
    ).toBe("Dupont");
  });

  test("falsy value 0 is not returned", () => {
    expect(
      getFirstAvailableField({ count: 0 }, ["count"], true),
    ).toBeNull();
  });

  test("empty string value is not returned", () => {
    expect(
      getFirstAvailableField({ name: "" }, ["name"], true),
    ).toBeNull();
  });

  test("matches lastname in last_name field", () => {
    const data = { last_name: "Dupont" };
    expect(getFirstAvailableField(data, ["lastname", "nom"], true)).toBe(
      "Dupont",
    );
  });

  test("empty keys array returns null", () => {
    expect(getFirstAvailableField({ email: "a@b.fr" }, [], true)).toBeNull();
  });

  test("first matching key wins", () => {
    const data = { email: "a@b.fr", Email: "b@c.fr" };
    expect(
      getFirstAvailableField(data, ["email", "Email"], true),
    ).toBe("a@b.fr");
  });

  test("case insensitive: EMAIL matches email", () => {
    expect(
      getFirstAvailableField({ EMAIL: "a@b.fr" }, ["email"], true),
    ).toBe("a@b.fr");
  });

  test("matches firstname in first_name field", () => {
    const data = { first_name: "Jean" };
    expect(
      getFirstAvailableField(data, ["firstname", "prenom"], true),
    ).toBe("Jean");
  });

  test("matches fullname in full_name field", () => {
    const data = { full_name: "Jean Dupont" };
    expect(
      getFirstAvailableField(data, ["fullname"], true),
    ).toBe("Jean Dupont");
  });

  test("false value is not returned", () => {
    expect(
      getFirstAvailableField({ active: false }, ["active"], true),
    ).toBeNull();
  });

  test("exact match when matchPrefix false", () => {
    const data = { prenom: "Jean", prenom_complet: "Jean-Pierre" };
    expect(
      getFirstAvailableField(data, ["prenom"], false),
    ).toBe("Jean");
  });
});

describe("extractUserFields", () => {
  test("compound field only: name is Jean Dupont (not duplicated)", () => {
    const data = {
      "Prénom et nom": "Jean Dupont",
      Email: "a@b.fr",
    };
    const result = extractUserFields(data);
    expect(result.name).toBe("Jean Dupont");
    expect(result.name).not.toBe("Jean Dupont Jean Dupont");
  });

  test("compound field via slug: name is Jean Dupont", () => {
    const data = {
      nom_et_prenom: "Jean Dupont",
      email: "a@b.fr",
    };
    const result = extractUserFields(data);
    expect(result.name).toBe("Jean Dupont");
  });

  test("separate first and last name: name is Jean Dupont", () => {
    const data = {
      Prénom: "Jean",
      Nom: "Dupont",
      Email: "a@b.fr",
    };
    const result = extractUserFields(data);
    expect(result.firstname).toBe("Jean");
    expect(result.lastname).toBe("Dupont");
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound + separate last name: compound takes priority", () => {
    const data = {
      "Prénom et nom": "Jean Dupont",
      Nom: "Dupont",
      Email: "a@b.fr",
    };
    const result = extractUserFields(data);
    expect(result.name).toBe("Jean Dupont");
  });

  test("Name and email (not compound): name not taken from that field", () => {
    const data = {
      "Name and email": "Jean Dupont",
      Email: "a@b.fr",
    };
    const result = extractUserFields(data);
    expect(result.name).not.toBe("Jean Dupont Jean Dupont");
  });

  test("empty data: all null", () => {
    const result = extractUserFields({});
    expect(result.email).toBeNull();
    expect(result.name).toBeNull();
    expect(result.firstname).toBeNull();
    expect(result.lastname).toBeNull();
    expect(result.fullname).toBeNull();
  });

  test("only email, no name fields", () => {
    const result = extractUserFields({ email: "a@b.fr" });
    expect(result.email).toBe("a@b.fr");
    expect(result.name).toBeNull();
  });

  test("fullname key used as fallback", () => {
    const result = extractUserFields({
      fullname: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("name key used as fallback", () => {
    const result = extractUserFields({
      name: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound value trimmed", () => {
    const result = extractUserFields({
      "Prénom et nom": "  Jean Dupont  ",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("firstName only: name is firstName", () => {
    const result = extractUserFields({
      Prénom: "Jean",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean");
  });

  test("lastName only: name is lastName", () => {
    const result = extractUserFields({
      Nom: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Dupont");
  });

  test("snake_case keys: first_name and last_name", () => {
    const result = extractUserFields({
      first_name: "Jean",
      last_name: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("camelCase keys: firstName and lastName", () => {
    const result = extractUserFields({
      firstName: "Jean",
      lastName: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("nomcomplet key as fallback", () => {
    const result = extractUserFields({
      nomcomplet: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("Nom complet key as fallback", () => {
    const result = extractUserFields({
      "Nom complet": "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("multiple compound fields: first found wins", () => {
    const result = extractUserFields({
      "Prénom et nom": "Jean Dupont",
      nom_et_prenom: "Marie Martin",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("EMAIL uppercase key", () => {
    const result = extractUserFields({
      EMAIL: "a@b.fr",
      Prénom: "Jean",
      Nom: "Dupont",
    });
    expect(result.email).toBe("a@b.fr");
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound with extra spaces in value", () => {
    const result = extractUserFields({
      "Prénom et nom": "Jean  Pierre   Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean  Pierre   Dupont");
  });

  test("Brevo-style contact_properties keys", () => {
    const result = extractUserFields({
      EMAIL: "a@b.fr",
      FIRSTNAME: "Jean",
      LASTNAME: "Dupont",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("Systeme.io style full_name", () => {
    const result = extractUserFields({
      full_name: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("name key with compound-like value", () => {
    const result = extractUserFields({
      name: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("Cal.com style: attendee name", () => {
    const result = extractUserFields({
      name: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound preferred over separate when both present", () => {
    const result = extractUserFields({
      "Prénom et nom": "Marie Martin",
      Prénom: "Jean",
      Nom: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Marie Martin");
  });

  test("value from compound is stringified", () => {
    const result = extractUserFields({
      "Prénom et nom": 12345,
      email: "a@b.fr",
    });
    expect(result.name).toBe("12345");
  });

  test("no email: email is null", () => {
    const result = extractUserFields({
      "Prénom et nom": "Jean Dupont",
    });
    expect(result.email).toBeNull();
    expect(result.name).toBe("Jean Dupont");
  });

  test("pimms_id not in name extraction", () => {
    const result = extractUserFields({
      pimms_id: "abc123",
      "Prénom et nom": "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound with empty string: fallback to fullname/name", () => {
    const result = extractUserFields({
      "Prénom et nom": "",
      name: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound with whitespace only: fallback used", () => {
    const result = extractUserFields({
      "Prénom et nom": "   ",
      fullname: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("compound with falsy value: fallback to first+last", () => {
    const result = extractUserFields({
      "Prénom et nom": "",
      Prénom: "Jean",
      Nom: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("surname key for lastName", () => {
    const result = extractUserFields({
      firstname: "Jean",
      surname: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("fullname preferred over first+last when both present", () => {
    const result = extractUserFields({
      fullname: "Marie Martin",
      first_name: "Jean",
      last_name: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Marie Martin");
  });

  test("fullname + firstName only: name is fullname", () => {
    const result = extractUserFields({
      fullname: "Jean Dupont",
      first_name: "Jean",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("fullname + lastName only: name is fullname", () => {
    const result = extractUserFields({
      fullname: "Jean Dupont",
      last_name: "Dupont",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Jean Dupont");
  });

  test("return shape: all five fields present", () => {
    const result = extractUserFields({
      "Prénom et nom": "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("firstname");
    expect(result).toHaveProperty("lastname");
    expect(result).toHaveProperty("fullname");
  });

  test("compound with object value: stringified", () => {
    const result = extractUserFields({
      "Prénom et nom": { label: "Jean Dupont" },
      email: "a@b.fr",
    });
    expect(result.name).toBe("[object Object]");
  });

  test("fallback order: fullname before name", () => {
    const result = extractUserFields({
      fullname: "Full Name",
      name: "Name Only",
      email: "a@b.fr",
    });
    expect(result.name).toBe("Full Name");
  });

  test("name fallback when fullname absent", () => {
    const result = extractUserFields({
      name: "Jean Dupont",
      email: "a@b.fr",
    });
    expect(result.fullname).toBe("Jean Dupont");
    expect(result.name).toBe("Jean Dupont");
  });
});

describe("getName", () => {
  test("compound only: fullName used", () => {
    expect(getName(null, null, "Jean Dupont")).toBe("Jean Dupont");
  });

  test("separate first and last: combined", () => {
    expect(getName("Jean", "Dupont", null)).toBe("Jean Dupont");
  });

  test("double bug: fullName takes priority over firstName+lastName", () => {
    expect(
      getName("Jean Dupont", "Jean Dupont", "Jean Dupont"),
    ).toBe("Jean Dupont");
  });

  test("all null returns random name", () => {
    const result = getName(null, null, null);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("fullName with whitespace", () => {
    expect(getName(null, null, "  Jean Dupont  ")).toBe("  Jean Dupont  ");
  });

  test("firstName only", () => {
    expect(getName("Jean", null, null)).toBe("Jean");
  });

  test("lastName only", () => {
    expect(getName(null, "Dupont", null)).toBe("Dupont");
  });

  test("fullName empty string falls through to random", () => {
    const result = getName(null, null, "");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  test("fullName with only spaces falls through", () => {
    const result = getName(null, null, "   ");
    expect(result).toBe("   ");
  });

  test("firstName and lastName with extra spaces", () => {
    const result = getName("  Jean  ", "  Dupont  ", null);
    expect(result).toContain("Jean");
    expect(result).toContain("Dupont");
  });

  test("fullName beats firstName when lastName null", () => {
    expect(getName("Jean", null, "Jean Dupont")).toBe("Jean Dupont");
  });

  test("fullName beats lastName when firstName null", () => {
    expect(getName(null, "Dupont", "Jean Dupont")).toBe("Jean Dupont");
  });
});
