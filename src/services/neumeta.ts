export declare interface JavaReference {
    class: string
    member: string | null
}

export declare interface ClassReference extends JavaReference {
    member: null
}

export declare interface MemberReference extends JavaReference {
    member: string
}

export declare interface NEUFileLocation {
    filename: string
    line: number | null
}

export declare interface ConfigOption {
    name: string
    description: string
    reference: MemberReference
    location: NEUFileLocation
}

export declare interface ConfigCategory {
    name: string
    description: string
    useReference: MemberReference
    useLocation: NEUFileLocation
    structReference: ClassReference
    structLocation: NEUFileLocation
    options: [ConfigOption]
}

export declare interface ConfigMeta {
    categories: [ConfigCategory]
}

// TODO: multi version / introduced semantics
export const latestData = require('./config-meta.json') as ConfigMeta;


