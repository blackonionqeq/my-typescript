export class Scope<T = any> {
  environmentRecords:Record<string, T> = Object.create(null)
  constructor(public parentScope: Scope<T>|null) {}
  getRecord(key: string): T|undefined {
    if (this.environmentRecords[key]) return this.environmentRecords[key]
    else if (this.parentScope) {
      return this.parentScope.getRecord(key)
    } else return undefined
  }
  setRecord(key: string, value: T) {
    this.environmentRecords[key] = value
  }
}