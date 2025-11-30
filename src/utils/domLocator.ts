import { DOMLocator } from '../types';

/**
 * Generate a unique CSS selector for an element
 */
function generateSelector(element: Node): string {
  if (element.nodeType === Node.TEXT_NODE) {
    const parent = element.parentElement;
    if (!parent) return 'body';
    return generateSelector(parent);
  }

  if (element.nodeType !== Node.ELEMENT_NODE) return 'body';

  const el = element as Element;
  
  // If it's body or html, return it
  if (el.tagName === 'BODY' || el.tagName === 'HTML') {
    return el.tagName.toLowerCase();
  }

  const path: string[] = [];

  let current: Element | null = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();

    // Prefer ID if available
    if (current.id) {
      selector += `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    // Add classes if available
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter(c => c && !c.includes('web-annotator'))
        .map(c => `.${CSS.escape(c)}`)
        .join('');
      if (classes) selector += classes;
    }

    // Add nth-child if there are siblings
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.nodeName === current!.nodeName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    
    // Stop at body
    if (current.tagName === 'BODY' || current.tagName === 'HTML') {
      break;
    }
    
    current = parent;
  }

  return path.length > 0 ? path.join(' > ') : 'body';
}

/**
 * Find text offset within a text node
 */
function getTextOffset(textNode: Node, offset: number): number {
  let totalOffset = 0;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === textNode) {
      return totalOffset + offset;
    }
    totalOffset += node.textContent?.length || 0;
  }

  return totalOffset;
}

/**
 * Create a locator for a text range
 */
export function createLocator(range: Range): DOMLocator {
  // Get the container element (prefer element over text node)
  let container: Node = range.commonAncestorContainer;
  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentElement || document.body;
  }
  
  const selector = generateSelector(container);
  
  // Get the text content before the selection within the container
  const containerElement = container.nodeType === Node.ELEMENT_NODE 
    ? container as Element 
    : document.body;
  
  const preRange = document.createRange();
  preRange.selectNodeContents(containerElement);
  preRange.setEnd(range.startContainer, range.startOffset);
  const textBefore = preRange.toString();
  
  const textContent = range.toString();
  const textOffset = textBefore.length;

  // Store start/end container info if they're text nodes
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;
  
  return {
    selector,
    textOffset,
    textContent,
    startOffset: startContainer.nodeType === Node.TEXT_NODE ? range.startOffset : undefined,
    endOffset: endContainer.nodeType === Node.TEXT_NODE ? range.endOffset : undefined,
  };
}

/**
 * Restore a range from a locator
 */
export function restoreRange(locator: DOMLocator): Range | null {
  try {
    const element = document.querySelector(locator.selector);
    if (!element) {
      console.warn('Selector not found:', locator.selector);
      return null;
    }

    // Remove existing highlights to get clean text
    const tempElement = element.cloneNode(true) as Element;
    const highlights = tempElement.querySelectorAll('.web-annotator-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });

    // Find the text node and offset
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip text nodes inside existing highlights
          let parent = node.parentElement;
          while (parent) {
            if (parent.classList.contains('web-annotator-highlight')) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentOffset = 0;
    let targetNode: Node | null = null;
    let targetOffset = 0;

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const nodeText = node.textContent || '';
      const nodeLength = nodeText.length;
      
      if (currentOffset + nodeLength >= locator.textOffset) {
        targetNode = node;
        targetOffset = locator.textOffset - currentOffset;
        
        // Verify the text matches
        const expectedText = locator.textContent;
        const actualText = nodeText.substring(targetOffset, targetOffset + expectedText.length);
        if (actualText === expectedText) {
          break;
        }
      }
      
      currentOffset += nodeLength;
    }

    if (!targetNode) {
      // Fallback: search for text content in all text nodes
      const allTextNodes: Node[] = [];
      const fallbackWalker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            let parent = node.parentElement;
            while (parent) {
              if (parent.classList.contains('web-annotator-highlight')) {
                return NodeFilter.FILTER_REJECT;
              }
              parent = parent.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      let n: Node | null;
      while ((n = fallbackWalker.nextNode())) {
        allTextNodes.push(n);
      }

      for (const textNode of allTextNodes) {
        const text = textNode.textContent || '';
        const index = text.indexOf(locator.textContent);
        if (index !== -1) {
          targetNode = textNode;
          targetOffset = index;
          break;
        }
      }
    }

    if (!targetNode) {
      console.warn('Could not find target node for text:', locator.textContent);
      return null;
    }

    const range = document.createRange();
    const textLength = locator.textContent.length;
    
    try {
      range.setStart(targetNode, targetOffset);
      range.setEnd(targetNode, targetOffset + textLength);
    } catch (error) {
      console.error('Error setting range:', error);
      return null;
    }

    return range;
  } catch (error) {
    console.error('Error restoring range:', error);
    return null;
  }
}

