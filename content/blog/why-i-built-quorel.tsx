export default function Body() {
  return (
    <>
      <p>
        Every project I've worked on that needed structured web data ended up the same way. Pick a scraping tool. Wire it to a scheduler. Pipe the output into a cleaner. Store it somewhere. Version it manually. Then spend the next two weeks fixing it when the source site changes its layout.
      </p>
      <p>
        None of that is the actual work. The actual work is what you do with the data once you have it. But you can't get there until you've built the pipeline, and building the pipeline takes longer than anyone budgets for.
      </p>
      <p>
        The tools exist — scraping libraries, headless browsers, ETL platforms, data warehouses — but they're rigid, they don't talk to each other cleanly, and each one is solving a slightly different version of the problem. You end up as the glue. And being the glue is expensive in time, money, and patience.
      </p>
      <p>
        Quorel is my answer to that. Describe what data you want in plain English, point it at sources, and get a clean versioned API back. The infrastructure disappears. The data is just there — typed, structured, refreshed nightly, queryable, and downloadable in whatever format you need.
      </p>
      <p>
        It's in public beta. The rough edges are real. But the core pipeline works, and I'm building it in public. If something isn't working for you, I want to know.
      </p>
    </>
  );
}