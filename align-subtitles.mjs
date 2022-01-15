import { program } from 'commander';
import glob from 'glob';
import mv from 'mv';
import { basename, dirname, extname, join } from 'path';

program.version('0.0.1');

program
  .option('-d --do', 'really do it')
  .requiredOption('-s, --subtitles <folder>', 'subtitle folder')
  .requiredOption('-v, --videos <folder>', 'video folder');

program.parse(process.argv);

const options = program.opts();

console.log(`search all subtitles in ${options.subtitles}`);
let subtitles = glob.sync('**/*.+(ass|srt)', {
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
  return /(S|s)\d+(E|e)\d+/.exec(name)[0].toUpperCase();
}

console.log('extract episode info on subtitles');
const keyedSubs = subtitles.reduce((g, c) => ({ ...g, [extractEpisode(c)]: c }), {});

console.log('extract episode info on videos');
const keyedVids = videos.reduce((g, c) => ({ ...g, [extractEpisode(c)]: c }), {});

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
