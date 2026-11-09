// Validate project files before passing any data to Blockly's deserializer.
// The same checks apply to files chosen by the user and to autosaved projects.
// This does not make generated firmware safe to run on physical hardware.
(function (root) {
  "use strict";

  const LIMITS = Object.freeze({
    bytes: 400000,
    blocks: 400,
    nodes: 20000,
    depth: 180,
    keys: 250,
    arrayItems: 2500,
    text: 50000,
  });
  const dangerousKeys = new Set(["__proto__", "prototype", "constructor"]);
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const invalid = detail => { throw new Error("Neplatný blokový projekt: " + detail); };

  function validateProject(state, isKnownBlockType) {
    if (!isObject(state)) invalid("očekává se objekt JSON.");
    const wrapped = state.format === "shieldio-blocks-v1";
    if ("format" in state && !wrapped) invalid("nepodporovaný formát.");
    const workspace = wrapped ? state.workspace : state;
    if (!isObject(workspace) || !isObject(workspace.blocks) || !Array.isArray(workspace.blocks.blocks)) {
      invalid("chybí seznam bloků.");
    }

    // Bound the entire JSON tree, not only known blocks. Blockly serializes
    // fields, mutations and variables as well as nested block connections.
    let nodes = 0;
    const stack = [{ value: state, depth: 0 }];
    while (stack.length) {
      const { value, depth } = stack.pop();
      if (++nodes > LIMITS.nodes || depth > LIMITS.depth) invalid("příliš složitá struktura.");
      if (typeof value === "string") {
        if (value.length > LIMITS.text) invalid("příliš dlouhý text.");
      } else if (Array.isArray(value)) {
        if (value.length > LIMITS.arrayItems) invalid("příliš dlouhé pole.");
        for (const item of value) stack.push({ value: item, depth: depth + 1 });
      } else if (isObject(value)) {
        const keys = Object.keys(value);
        if (keys.length > LIMITS.keys) invalid("příliš mnoho položek.");
        for (const key of keys) {
          if (dangerousKeys.has(key)) invalid("nepovolený název položky.");
          stack.push({ value: value[key], depth: depth + 1 });
        }
      }
    }

    // Inspect block connections separately: unknown Blockly block types must
    // never reach deserialization, and projects must have one setup/loop root.
    const topBlocks = workspace.blocks.blocks;
    if (!topBlocks.length || topBlocks.length > LIMITS.blocks) invalid("neplatný počet bloků.");
    const setups = topBlocks.filter(block => block?.type === "shieldio_setup");
    const loops = topBlocks.filter(block => block?.type === "shieldio_loop");
    if (setups.length !== 1 || loops.length !== 1) invalid("je potřeba jeden blok Při spuštění a jeden Opakuj stále.");

    let blockCount = 0;
    const remaining = [...topBlocks];
    while (remaining.length) {
      const block = remaining.pop();
      if (!isObject(block) || typeof block.type !== "string" ||
          !isKnownBlockType(block.type)) invalid("neznámý nebo nepodporovaný blok.");
      if (++blockCount > LIMITS.blocks) invalid("příliš mnoho bloků.");
      if (block.inputs !== undefined) {
        if (!isObject(block.inputs)) invalid("neplatné vstupy bloku.");
        for (const input of Object.values(block.inputs)) {
          if (!isObject(input)) invalid("neplatné propojení bloků.");
          if (input.block !== undefined) remaining.push(input.block);
          if (input.shadow !== undefined) remaining.push(input.shadow);
        }
      }
      if (block.next !== undefined) {
        if (!isObject(block.next) || !isObject(block.next.block)) invalid("neplatné pokračování bloku.");
        remaining.push(block.next.block);
      }
    }
    return { workspace, profile: wrapped && state.profile === "universal" ? "universal" : "red", advanced: wrapped && state.advanced === true };
  }

  root.SHIELDIO_BLOCK_PROJECT = Object.freeze({ LIMITS, validateProject });
})(typeof window === "object" ? window : globalThis);
