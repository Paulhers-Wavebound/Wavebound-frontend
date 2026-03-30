/** Shared utilities for badge drag-and-drop functionality */

export const getDropRange = (x: number, y: number): Range | null => {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  
  const pos = (document as any).caretPositionFromPoint?.(x, y);
  if (!pos?.offsetNode) return null;
  
  const range = document.createRange();
  range.setStart(pos.offsetNode, pos.offset);
  range.collapse(true);
  return range;
};

export const setupBadgeDraggable = (
  badge: Element,
  draggedRef: React.MutableRefObject<HTMLElement | null>,
  dropIndicatorRef: React.MutableRefObject<HTMLElement | null>,
  onHoverClear?: () => void
): void => {
  const el = badge as HTMLElement;
  Object.assign(el, { draggable: true, contentEditable: 'false' });
  el.style.cursor = 'move';
  
  el.ondragstart = (e: DragEvent) => {
    e.stopPropagation();
    draggedRef.current = el;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/html', el.outerHTML);
    el.style.opacity = '0.4';
    onHoverClear?.();
  };
  
  el.ondragend = (e: DragEvent) => {
    e.stopPropagation();
    el.style.opacity = '1';
    draggedRef.current = null;
    dropIndicatorRef.current?.remove();
    dropIndicatorRef.current = null;
  };
};

export const handleEditorDragOver = (
  event: DragEvent,
  editorRef: HTMLElement | null,
  draggedRef: React.MutableRefObject<HTMLElement | null>,
  dropIndicatorRef: React.MutableRefObject<HTMLElement | null>
): void => {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer!.dropEffect = 'move';
  
  if (!editorRef || !draggedRef.current) return;
  
  dropIndicatorRef.current?.remove();
  dropIndicatorRef.current = null;
  
  const range = getDropRange(event.clientX, event.clientY);
  if (!range) return;
  
  const indicator = document.createElement('span');
  indicator.className = 'inline-block w-0.5 h-4 bg-primary animate-pulse';
  indicator.style.cssText = 'margin: 0 2px; vertical-align: middle;';
  indicator.contentEditable = 'false';
  dropIndicatorRef.current = indicator;
  
  try { range.insertNode(indicator); } catch {}
};

export const handleEditorDrop = (
  event: DragEvent,
  editorRef: HTMLElement | null,
  draggedRef: React.MutableRefObject<HTMLElement | null>,
  dropIndicatorRef: React.MutableRefObject<HTMLElement | null>,
  onAutoSave: () => void,
  onSetupBadge: (badge: HTMLElement) => void
): void => {
  event.preventDefault();
  event.stopPropagation();
  
  dropIndicatorRef.current?.remove();
  dropIndicatorRef.current = null;
  
  let html = event.dataTransfer!.getData('text/html').replace(/<meta[^>]*>/gi, '');
  if (!html?.includes('data-type')) return;
  
  const oldBadge = draggedRef.current;
  const range = getDropRange(event.clientX, event.clientY);
  
  if (range) {
    editorRef?.focus();
    
    if (oldBadge?.parentNode && editorRef?.contains(oldBadge)) {
      oldBadge.parentNode.removeChild(oldBadge);
    }
    
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const badge = temp.firstChild as HTMLElement;
    
    if (badge) {
      range.insertNode(badge);
      const space = document.createTextNode('\u00A0');
      badge.parentNode?.insertBefore(space, badge.nextSibling);
      range.setStartAfter(space);
      range.collapse(true);
      
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      onSetupBadge(badge);
    }
  }
  
  draggedRef.current = null;
  setTimeout(onAutoSave, 50);
};

export const handleEditorDragLeave = (
  event: DragEvent,
  editorRef: HTMLElement | null,
  dropIndicatorRef: React.MutableRefObject<HTMLElement | null>
): void => {
  if (event.target === editorRef && dropIndicatorRef.current) {
    dropIndicatorRef.current.remove();
    dropIndicatorRef.current = null;
  }
};
