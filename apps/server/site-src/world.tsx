import { createRoot } from 'react-dom/client';
import { RosterGallery } from './roster';
const target = document.getElementById('new-roster');
if (target)
    createRoot(target).render(<RosterGallery />);
