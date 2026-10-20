interface RepoInitialiser {
  initialise(projectDirectory: string): Promise<{ committed: boolean }>;
}

export type { RepoInitialiser };
