import { program } from 'commander';
import glob from 'glob';
import mv from 'mv';
import { basename, dirname, extname, join } from 'path';

program.version('0.0.1');

program
  .requiredOption('-s, --subtitles <folder>', 'subtitle folder')
  .requiredOption('-v, --videos <folder>', 'video folder')
  .option('-p, --pattern <pattern>', 'pattern')
  .option('-d --do', 'really do it');

program.parse(process.argv);

const options = program.opts();
console.log(`search all subtitles in ${options.subtitles}`);
let subtitles = glob.sync(`**/${options.pattern || '*'}.+(ass|srt|smi)`, {
  absolute: true,
  cwd: options.subtitles,
});
console.log('found', subtitles.length);

console.log(`search all videos in ${options.videos}`);
let videos = glob.sync('**/*.+(mkv|mp4)', {
  absolute: true,
  cwd: options.videos,
});
console.log('found', videos.length);

function extractEpisode(name) {
  const [, s, e] = /s(\d+)\s*e(\d+)/i.exec(name);
  return Number(s) * 10000 + Number(e);
}

console.log('extract episode info on subtitles');
const keyedSubs = subtitles.reduce((g, c) => ({ ...g, [extractEpisode(c)]: c }), {});
// console.log(keyedSubs);

console.log('extract episode info on videos');
const keyedVids = videos.reduce((g, c) => ({ ...g, [extractEpisode(c)]: c }), {});
// console.log(keyedVids);
// const epsWithoutSub = Object.entries(keyedEps).filter(([k]) => !keyedSubs[k]);
// console.log(epsWithoutSub);

for (const [k, sub] of Object.entries(keyedSubs)) {
  const vid = keyedVids[k];

  const dir = dirname(vid);
  const name = basename(vid);
  const ext = extname(sub);
  const newSub = join(dir, name.substring(0, name.length - extname(name).length) + ext);
  console.log('mv', sub, newSub);
  if (options.do) {
    mv(sub, newSub, err => {
      if (err) {
        console.error(err);
      }
    });
  }
}
