export interface GithubFile {
  path: string
  sha: string
  size: number
  url: string
}

export interface GithubCommit {
  sha: string
  message: string
  author: string
  authorDate: string
  url: string
}

export interface GithubIssue {
  number: number
  title: string
  body: string
  url: string
  createdAt: string
  filePaths: string[]
}
