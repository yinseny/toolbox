import { program } from 'commander';
import glob from 'glob';
import mv from 'mv';
import { basename, dirname, join } from 'path';

program.version('0.0.1');

program
  .requiredOption('-e, --expression <expression>', 'new episode expression')
  .requiredOption('-f, --folder <folder>', 'folder')
  .option('-p, --pattern <pattern>', 'pattern')
  .option('-d --do', 'really do it');

program.parse(process.argv);

const options = program.opts();

console.log(`search all videos & subtitles in ${options.folder}`);
let files = glob.sync(`**/${options.pattern || '*'}.+(mkv|mp4|ass|srt|smi)`, {
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

  const newSE = eval(`(() => {const s = ${Number(season)}, e = ${Number(episode)}; return ${options.expression};})()`);

  const newName = name.substring(0, index) + newSE + name.substring(index + text.length);
  const newFile = join(dir, newName);
  console.log('mv', file, newFile);

  if (options.do) {
    mv(file, newFile, err => {
      if (err) {
        console.error(err);
      }
    });
  }
}
