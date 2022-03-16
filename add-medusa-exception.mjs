import { program } from 'commander';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import axios from 'axios';
import { copyFile } from 'fs/promises';
import { basename } from 'path';

program.version('0.0.1');
program
  .requiredOption('-f, --file <db file>', 'medusa db file')
  .option('-l, --language <language>', 'language')
  .option('-c --copy', 'copy the db')
  .option('-d --do', 'really do it');
program.parse(process.argv);
const options = program.opts();

const TMDB_APIKEY = '29e1a883872b17723f747ebfbe4e85d4';

sqlite3.verbose();

const filename = options.copy ? './' + basename(options.file) : options.file;
if (options.copy) {
  await copyFile(options.file, filename);
}
const db = await open({ filename, driver: sqlite3.Database });

const exceptions = await db.all('SELECT * from scene_exceptions');

const sql =
  'INSERT INTO scene_exceptions (indexer, series_id, title, season, custom) ' +
  'VALUES (:indexer, :series_id, :title, -1, 1)';
const statement = await db.prepare(sql);

const shows = await db.all('SELECT * from tv_shows');
for (const { indexer, indexer_id } of shows) {
  if (indexer === 4) {
    const url = `https://api.themoviedb.org/3/tv/${indexer_id}`;
    const res = await axios.get(url, { params: { api_key: TMDB_APIKEY, language: options.language } });
    const name = options.language ? res.data.name : res.data.original_name;
    if (
      !exceptions.find(
        e =>
          e.indexer === indexer && e.series_id === indexer_id && e.title === name && e.season === -1 && e.custom === 1
      )
    ) {
      const row = { ':indexer': indexer, ':series_id': indexer_id, ':title': name };
      const { lastID } = await statement.run(row);
      console.log(lastID, JSON.stringify(row, null, ''));
    }
  }
}

await db.close();
