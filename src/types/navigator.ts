export interface NavigatorAction {
  type: 'focusNodes' | 'highlightEdges' | 'openInspector' | 'isolateCluster' | 'showImpactPath' | 'showSearchResults';
  nodeIds?: string[];
  edgeKeys?: string[];
  message: string;
}

export interface NavigatorResponse {
  content: string;
  actions: NavigatorAction[];
  referencedFiles: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: NavigatorAction[];
  referencedFiles?: string[];
  timestamp: number;
}
