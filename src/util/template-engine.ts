import { compile, Args } from 'tempura';

export default class TemplateEngine {
  private cache: { [templateHash: string]: Function } = {};
  private blocks: { [blockName: string]: Function } = {};

  public addBlock(fn: Function, name?: string): this {
    this.blocks[name || fn.name] = fn;
    this.resetCache();
    return this;
  }

  public addManyBlocks(blocks: { [blockName: string]: Function }): this {
    Object.keys(blocks).forEach(name => this.addBlock(blocks[name], name));
    return this;
  }

  public async render(template: string, data: Args): Promise<string> {
    // hash template
    const hash = this.generateHash(template);

    if (!this.cache[hash]) {
      this.cache[hash] = await Promise.resolve(compile(template));
    }

    return this.cache[hash](data, this.blocks);
  }

  private generateHash(template: string): string {
    return template.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }

  resetCache() {
    this.cache = {};
  }

  resetBlocks() {
    this.blocks = {};
  }
}