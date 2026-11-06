import Prism from 'prismjs';

// Prism plugins/components resolve the global instance. `manual` disables
// Prism's implicit DOM scan so highlighting stays under application control.
if (typeof window !== 'undefined') window.Prism = Prism;
Prism.manual = true;

export default Prism;
