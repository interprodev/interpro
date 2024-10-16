module.exports = {
	/*
	 * Resolve and load @commitlint/config-conventional from node_modules.
	 * Referenced packages must be installed
	 */
	extends: ['@commitlint/config-conventional'],
	/*
	 * Resolve and load conventional-changelog-atom from node_modules.
	 * Referenced packages must be installed
	 */
	parserPreset: 'conventional-changelog-conventionalcommits',
	/*
	 * Resolve and load @commitlint/format from node_modules.
	 * Referenced package must be installed
	 */
	formatter: '@commitlint/format',
	/*
	 * Whether commitlint uses the default ignore rules, see the description above.
	 */
	defaultIgnores: true,
	/*
	 * Custom URL to show upon failure
	 */
	helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
	/*
	 * Custom prompt configs
	 */
	prompt: {
		settings: {},
		messages: {
			skip: ':skip',
			max: 'upper %d chars',
			min: '%d chars at least',
			emptyWarning: 'can not be empty',
			upperLimitWarning: 'over limit',
			lowerLimitWarning: 'below limit'
		},
		questions: {
			type: {
				description: 'Select the type of change that you are committing:',
				enum: {
					feat: {
						description: '✨ A new feature',
						title: 'Features',
						emoji: '✨'
					},
					fix: {
						description: '🐛 A bug fix',
						title: 'Bug Fixes',
						emoji: '🐛'
					},
					docs: {
						description: '📚 Documentation only changes',
						title: 'Documentation',
						emoji: '📚'
					},
					style: {
						description: '💎 Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
						title: 'Styles',
						emoji: '💎'
					},
					refactor: {
						description: '💄 A code change that neither fixes a bug nor adds a feature',
						title: 'Code Refactoring',
						emoji: '💄'
					},
					perf: {
						description: '🚀 A code change that improves performance',
						title: 'Performance Improvements',
						emoji: '🚀'
					},
					test: {
						description: '🚨 Adding missing tests or correcting existing tests',
						title: 'Tests',
						emoji: '🚨'
					},
					build: {
						description: '📦 Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)',
						title: 'Builds',
						emoji: '📦'
					},
					ci: {
						description: '🔧 Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)',
						title: 'Continuous Integrations',
						emoji: '🔧'
					},
					chore: {
						description: "✅ Other changes that don't modify src or test files",
						title: 'Chores',
						emoji: '✅'
					},
					revert: {
						description: '🗑️  Reverts a previous commit',
						title: 'Reverts',
						emoji: '🗑️'
					}
				}
			},
			scope: {
				description: 'What is the scope of this change (e.g. component or file name)'
			},
			subject: {
				description: 'Write a short, imperative tense description of the change'
			},
			body: {
				description: 'Provide a longer description of the change'
			},
			isBreaking: {
				description: 'Are there any breaking changes?'
			},
			breakingBody: {
				description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself'
			},
			breaking: {
				description: 'Describe the breaking changes'
			},
			isIssueAffected: {
				description: 'Does this change affect any open issues?'
			},
			issuesBody: {
				description: 'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself'
			},
			issues: {
				description: 'Add issue references (e.g. "fix #123", "re #123".)'
			}
		}
	}
};
