"use client";

import { useEffect, useState } from 'react';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  fix?: string;
}

export default function AccessibilityChecker() {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [score, setScore] = useState(100);

  useEffect(() => {
    const checkAccessibility = () => {
      const foundIssues: AccessibilityIssue[] = [];

      // Check for missing alt attributes
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        foundIssues.push({
          type: 'error',
          message: `${images.length} image(s) missing alt text`,
          element: 'img',
          fix: 'Add meaningful alt attributes to all images'
        });
      }

      // Check for missing form labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      inputs.forEach(input => {
        const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
        if (!hasLabel) {
          foundIssues.push({
            type: 'error',
            message: 'Form input missing label',
            element: input.tagName.toLowerCase(),
            fix: 'Add labels or aria-label attributes to form inputs'
          });
        }
      });

      // Check for insufficient color contrast (simplified check)
      const elements = document.querySelectorAll('[style*="color"]');
      let contrastIssues = 0;
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        
        // Simplified contrast check for common cases
        if (color === 'rgb(128, 128, 128)' && bgColor === 'rgb(255, 255, 255)') {
          contrastIssues++;
        }
      });
      
      if (contrastIssues > 0) {
        foundIssues.push({
          type: 'warning',
          message: `${contrastIssues} potential color contrast issue(s)`,
          fix: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text)'
        });
      }

      // Check for missing heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      let hierarchyIssues = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > lastLevel + 1) {
          hierarchyIssues++;
        }
        lastLevel = level;
      });

      if (hierarchyIssues > 0) {
        foundIssues.push({
          type: 'warning',
          message: `${hierarchyIssues} heading hierarchy issue(s)`,
          fix: 'Use headings in order (h1, h2, h3...) without skipping levels'
        });
      }

      // Check for missing focus indicators
      const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
      let missingFocus = 0;
      focusableElements.forEach(el => {
        const styles = window.getComputedStyle(el, ':focus');
        if (!styles.outline || styles.outline === 'none') {
          missingFocus++;
        }
      });

      if (missingFocus > 0) {
        foundIssues.push({
          type: 'info',
          message: `${missingFocus} element(s) may need better focus indicators`,
          fix: 'Ensure all interactive elements have visible focus states'
        });
      }

      // Check for missing ARIA landmarks
      const landmarks = document.querySelectorAll('[role="main"], [role="banner"], [role="navigation"], [role="contentinfo"], main, header, nav, footer');
      if (landmarks.length < 2) {
        foundIssues.push({
          type: 'info',
          message: 'Consider adding more ARIA landmarks',
          fix: 'Use semantic HTML5 elements or ARIA landmark roles'
        });
      }

      setIssues(foundIssues);
      
      // Calculate accessibility score
      const errorWeight = 20;
      const warningWeight = 10;
      const infoWeight = 5;
      
      const deductions = 
        foundIssues.filter(i => i.type === 'error').length * errorWeight +
        foundIssues.filter(i => i.type === 'warning').length * warningWeight +
        foundIssues.filter(i => i.type === 'info').length * infoWeight;
      
      setScore(Math.max(0, 100 - deductions));
    };

    // Run check after component mounts and DOM is ready
    const timer = setTimeout(checkAccessibility, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="fixed bottom-4 left-20 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors no-print"
        title="Accessibility Checker"
        aria-label="Open accessibility checker"
      >
        ♿
      </button>

      {isVisible && (
        <div className="absolute bottom-14 left-0 bg-white rounded-xl shadow-lg border border-neutral-200 p-4 min-w-96 max-h-96 overflow-y-auto no-print">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-neutral-800 flex items-center gap-2">
              ♿ Accessibility Score
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Close accessibility checker"
            >
              ×
            </button>
          </div>

          <div className="text-center mb-4">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}/100
            </div>
            <div className="text-sm text-neutral-600">
              {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Work'}
            </div>
          </div>

          {issues.length === 0 ? (
            <div className="text-center text-green-600 py-4">
              🎉 No accessibility issues found!
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-800 text-sm">
                Issues Found ({issues.length})
              </h4>
              
              {issues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-3 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getIssueIcon(issue.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">
                        {issue.message}
                      </p>
                      {issue.element && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Element: {issue.element}
                        </p>
                      )}
                      {issue.fix && (
                        <p className="text-xs text-neutral-600 mt-2 italic">
                          💡 {issue.fix}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="text-xs text-neutral-500 space-y-1">
              <div className="flex justify-between">
                <span>WCAG 2.1 AA Compliance</span>
                <span className={score >= 90 ? 'text-green-600' : 'text-red-600'}>
                  {score >= 90 ? '✓' : '✗'}
                </span>
              </div>
              <p className="text-xs">
                This is a basic automated check. Manual testing recommended.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}