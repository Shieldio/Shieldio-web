import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import worker from "../workers/main-web.mjs";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root));
const index = JSON.parse(read(".well-known/agent-skills/index.json").toString("utf8"));

test("skills index v0.2.0 has valid names, descriptions, and exact SHA-256 digests", () => {
  assert.equal(index.$schema, "https://schemas.agentskills.io/discovery/0.2.0/schema.json");
  assert.ok(Array.isArray(index.skills) && index.skills.length >= 1);
  const seen = new Set();
  for (const skill of index.skills) {
    assert.match(skill.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(skill.name.length <= 64 && !seen.has(skill.name));
    seen.add(skill.name);
    assert.equal(skill.type, "skill-md");
    assert.ok(typeof skill.description === "string" && skill.description.length <= 1024);
    assert.equal(skill.url, `/.well-known/agent-skills/${skill.name}/SKILL.md`);
    const artifact = read(skill.url.slice(1));
    const frontmatter = artifact.toString("utf8").match(/^---\nname: ([^\n]+)\ndescription: ([^\n]+)\n---\n/);
    assert.ok(frontmatter, "SKILL.md requires YAML metadata");
    assert.equal(frontmatter[1], skill.name);
    assert.equal(frontmatter[2], skill.description);
    assert.equal(skill.digest, "sha256:" + createHash("sha256").update(artifact).digest("hex"));
  }
});

function runtime() {
  const calls = [];
  return {
    calls,
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        calls.push({ pathname: url.pathname, method: request.method });
        try {
          return new Response(read(url.pathname.slice(1)), {
            status: 200,
            headers: { "Content-Type": "application/octet-stream" },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      }
    }
  };
}

test("Worker serves index and each SKILL.md as GET/HEAD with correct MIME and CORS", async () => {
  for (const path of ["/.well-known/agent-skills/index.json", ...index.skills.map(s => s.url)]) {
    const env = runtime();
    const type = path.endsWith(".json") ? "application/json" : "text/markdown";
    for (const method of ["GET", "HEAD"]) {
      const response = await worker.fetch(new Request("https://shieldio.cz" + path, { method }), env);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get("Content-Type"), new RegExp("^" + type));
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
      assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
      if (method === "HEAD") assert.equal(await response.text(), "");
      else assert.equal(await response.text(), read(path.slice(1)).toString("utf8"));
    }
    assert.deepEqual(env.calls.map(x => x.method), ["GET", "GET"]);
  }
});

test("unknown skills are 404 and unsupported methods are 405", async () => {
  const env = runtime();
  const missing = await worker.fetch(new Request("https://shieldio.cz/.well-known/agent-skills/unknown/SKILL.md"), env);
  assert.equal(missing.status, 404);
  const traversal = await worker.fetch(new Request("https://shieldio.cz/.well-known/agent-skills/foo/extra"), env);
  assert.equal(traversal.status, 404);
  const post = await worker.fetch(new Request("https://shieldio.cz/.well-known/agent-skills/index.json", { method: "POST" }), env);
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("Allow"), "GET, HEAD");
});
