
const fs = require('fs');
const path = require('path');

class GitRepository {
  constructor() {
    this.gitDir = this.findGitDir(process.cwd());
    if (!this.gitDir) {
      throw new Error('Not a Git repository.');
    }
    this.objectsDir = path.join(this.gitDir, 'objects');
    this.refsDir = path.join(this.gitDir, 'refs');
    this.headsDir = path.join(this.refsDir, 'heads');
  }

  findGitDir(startDir) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
      const gitDir = path.join(currentDir, '.git');
      if (fs.existsSync(gitDir) && fs.lstatSync(gitDir).isDirectory()) {
        return gitDir;
      }
      currentDir = path.dirname(currentDir);
    }
    return null;
  }
}

module.exports = GitRepository;
