import { program } from 'commander';
import glob from 'glob';
import mv from 'mv';
import { basename, dirname, join } from 'path';

program.version('0.0.1');

program
  .requiredOption('-s, --season <number>', 'season offset')
  .requiredOption('-e, --episode <number>', 'episode offset')
  .requiredOption('-f, --folder <folder>', 'folder')
  .option('-t --target <folder>', 'target folder')
  .option('-d --do', 'really do it');

program.parse(process.argv);

const options = program.opts();

console.log(`search all videos & subtitles in ${options.folder}`);
let files = glob.sync('**/*.+(mkv|mp4|ass|srt|smi)', {
  absolute: true,
  cwd: options.folder,
});
console.log('found', files.length);

for (const file of files) {
  const dir = dirname(file);
  const name = basename(file);

  const match = /s(\d+)\s*e(\d+)/i.exec(name);
  const [text, season, episode] = match;
  const index = match.index;

  const newSeason = Number(season) + Number(options.season);
  const newEpisode = Number(episode) + Number(options.episode);
  const newName = name.substring(0, index) + `S${newSeason}E${newEpisode}` + name.substring(index + text.length);
  const newFile = join(options.target || dir, newName);
  console.log('mv', file, newFile);

  if (options.do) {
    mv(file, newFile, err => {
      if (err) {
        console.error(err);
      }
    });
  }
}
