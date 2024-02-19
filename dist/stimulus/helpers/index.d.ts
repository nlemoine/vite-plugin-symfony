import { Application } from '@hotwired/stimulus';
import { I as ImportedModules, C as ControllerModule } from '../../types.d-C2tGYlLd.js';
import 'react';
import 'vue';
import 'svelte';

declare module "@hotwired/stimulus" {
    class Controller {
        __stimulusLazyController: boolean;
    }
}
declare function startStimulusApp(): Application;
declare function registerControllers(app: Application, modules: ImportedModules<ControllerModule>): void;

export { registerControllers, startStimulusApp };
