let simulation;

self.onmessage = async ({ data: { id, engineURL, netlist } }) => {
  try {
    if (!simulation) {
      const { Simulation } = await import(engineURL);
      simulation = new Simulation();
      await simulation.start();
    }
    simulation.setNetList(netlist);
    const result = await simulation.runSim();
    const diagnostics=simulation.getError?.()||[];
    const fatal=diagnostics.filter(message=>/error|fatal|unknown device|no such|not found|timestep too small|singular matrix/i.test(message));
    if(fatal.length)throw Error(fatal.join('\n')); 
    if (!result?.data?.length || !Number.isFinite(result.numPoints) || result.numPoints < 1) {
      throw new Error(simulation.getError?.().join('\n') || 'Simulace nevytvořila žádné výsledky.');
    }
    self.postMessage({ id, result: { ...result, engine: 'ngspice', log: simulation.getInfo?.() || '', diagnostics: simulation.getError?.() || [] } });
  } catch (error) {
    self.postMessage({ id, error: error.message || String(error) });
  }
};
