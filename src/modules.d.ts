declare module "virtual:symfony/controllers" {
  import { type ControllerConstructor } from "@hotwired/stimulus";
  const modules: {
    [controllerName: string]: ControllerConstructor;
  };
  export default modules;
}
