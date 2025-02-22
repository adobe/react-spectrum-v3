const Octokit = require('@octokit/rest');

const octokit = new Octokit({
  auth: `token ${process.env.GITHUB_TOKEN}`
});

run();

async function run() {
  let pr;
  // If we aren't running on a PR commit, double check if this is a branch created for a fork. If so, we'll need to
  // comment the build link on the fork.
  if (true) {
    try {
      const commit = await octokit.git.getCommit({
        owner: 'adobe',
        repo: 'react-spectrum',
        commit_sha: process.env.CIRCLE_SHA1
      });

      // Check if it is a merge commit from the github "Branch from fork action"
      if (commit && commit.data?.parents?.length === 2 && commit.data.message.indexOf('Merge') > -1) {
        // Unfortunately listPullRequestsAssociatedWithCommit doesn't return fork prs so have to use search api
        // to find the fork PR the original commit lives in
        const forkHeadCommit = commit.data.parents[1].sha;
        const searchRes = await octokit.search.issuesAndPullRequests({
          q: `${forkHeadCommit}+repo:adobe/react-spectrum+is:pr+is:open`
        });

        // Look for a PR that is from a fork and has a matching head commit as the current branch
        const pullNumbers = searchRes.data.items.filter(i => i.pull_request !== undefined).map(j => j.number);
        for (let pull_number of pullNumbers) {
          const {data} = await octokit.pulls.get({
            owner: 'adobe',
            repo: 'react-spectrum',
            pull_number
          });
          // eslint-disable-next-line max-depth
          if (data && data.head.repo.full_name !== 'adobe/react-spectrum' && data.head.sha === forkHeadCommit) {
            pr = pull_number;
            break;
          }
        }
      } else if (true) {
        // If it isn't a PR commit, then we are on main. Create a comment for the test app and docs build
        await octokit.repos.createCommitComment({
          owner: 'adobe',
          repo: 'react-spectrum',
          commit_sha: process.env.CIRCLE_SHA1,
          body: `Verdaccio builds:
      [CRA Test App](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/build/index.html)
      [NextJS Test App](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/next/index.html)
      [RAC Tailwind Example](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/rac-tailwind/index.html)
      [RAC Spectrum + Tailwind Example](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/rac-spectrum-tailwind/index.html)
      [S2 Parcel Example](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/s2-parcel-example/index.html)
      [S2 Webpack Example](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/s2-webpack-5-example/index.html)
      [S2 Next.js Example](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/s2-next-macros/index.html)
      [CRA Test App Size](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/publish-stats/build-stats.txt)
      [NextJS App Size](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/publish-stats/next-build-stats.txt)
      [Publish stats](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/publish-stats/publish.json)
      [Size diff since last release](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/publish-stats/size-diff.txt)
      [Docs](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/docs/index.html)
      [Storybook](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook/index.html)
      [S2 Storybook](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook-s2/index.html)`
        });
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    pr = process.env.CIRCLE_PULL_REQUEST.split('/').pop();
  }
  console.log('PR number to comment on', pr);
  if (pr != null) {
    try {
      await octokit.issues.createComment({
        owner: 'adobe',
        repo: 'react-spectrum',
        issue_number: pr,
        body: `Build successful! 🎉

  * [View the storybook](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook/index.html)
  * [View the storybook-19](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook-19/index.html)
  * [View the storybook-17](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook-17/index.html)
  * [View the storybook-16](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook-16/index.html)
  * [View the S2 storybook](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/storybook-s2/index.html)
  * [View the documentation](https://reactspectrum.blob.core.windows.net/reactspectrum/${process.env.CIRCLE_SHA1}/docs/index.html)`
      });
    } catch (err) {
      console.error(err);
    }
  }
}
