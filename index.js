const getCSV = require("get-csv");
const ogs = require("open-graph-scraper");
const express = require("express");

const app = express();
const port = 3000;

/*
 * * TODO caching
 * * TODO styling
 */

app.get("/", (req, res) => {
  main(req, res);
});

app.listen(port, () =>
  console.log(`Check out the previews at http://localhost:${port}!`)
);

async function main(req, res) {
  //
  const rows = await getCSV("data.csv");
  //   console.log(rows);
  //   const ogsData = await Promise.all(rows.map(r => ogsP({ url: r.link })));
  //
  //   rows.forEach(async r => {
  const rowHtml = await fetchAndRenderEntry(rows[1]);
  const htmlPromises = rows.map(r => fetchAndRenderEntry(r));
  const html = (await Promise.all(htmlPromises)).join("");
  res.send(html);
}

async function fetchAndRenderEntry(row) {
  try {
    //   console.log(r.link);
    const ogsData = await ogsP({ url: row.link });
    //   console.log(ogsData);
    const title = getIn(ogsData, ["data", "ogTitle"]);
    const img = getIn(ogsData, ["data", "ogImage", "url"]);
    //   });
    //

    //   console.log(ogsData);
    return `
<section style="min-height:350px;">
  <a href="${row.link}"><h2>${title}</h2></a>
  <img src="${img}" alt="${title}" style="max-height:300px; max-width:300px">
  <p>${row.category}</p>
  <p>${row.note}</p>
</section>`;
  } catch (e) {
    console.error("Failed to fetch open-graph data for " + row.link);
    return `
<section>
  <a href="${row.link}"><h2>[Missing open graph data]</h2></a>
  <p>${row.category}</p>
  <p>${row.note}</p>
</section>`;
  }
}

function ogsP(options) {
  return new Promise((resolve, reject) => {
    ogs(options, function(error, results) {
      if (error) {
        console.error(error);
        console.error(results);
        reject(results);
      } else {
        resolve(results);
      }
    });
  });
}

/**
 * Returns a property of a given object, no matter whether
 * it's a normal or an immutable-js object.
 * @param obj
 * @param property
 */
function get(obj, property) {
  if (!obj) {
    return undefined;
  } else if (obj.get) {
    /* obj is an immutabljs-object
     * NOTE: the canonical check atm would be `Immutable.Iterable.isIterable(obj)`
     * but that would require including immutable as dependency her and it'd be better
     * to keep this library independent of anything.
     */
    return obj.get(property);
  } else {
    /* obj is a vanilla object */
    return obj[property];
  }
}

/**
 * Tries to look up a property-path on a nested object-structure.
 * Where `obj.x.y` would throw an error if `x` wasn't defined
 * `get(obj, ['x','y'])` would return undefined.
 * @param obj
 * @param path
 * @return {*}
 */
function getIn(obj, path) {
  if (!path || !obj || path.length === 0) {
    return undefined;
  } else {
    const child = get(obj, path[0]);
    if (path.length === 1) {
      /* end of the path */
      return child;
    } else {
      /* recurse */
      return getIn(child, path.slice(1));
    }
  }
}
