export interface HostmaskArgs {
  source: string
  nickname: string
  username?: string
  hostname?: string
}

export class Hostmask {
  #source: string
  nickname: string
  username?: string
  hostname?: string

  constructor ({ source, nickname, username, hostname }: HostmaskArgs) {
    this.#source = source
    this.nickname = nickname
    this.username = username
    this.hostname = hostname
  }

  toString () {
    return this.#source
  }

  eq (other: any) {
    if (other instanceof Hostmask) return this.toString() === other.toString()
    else return false
  }
}

export function hostmask (source: string) {
  let username, nickname, hostname
  ; [username, hostname] = source.split(/@(.*)/)
  ; [nickname, username] = username.split(/!(.*)/)
  return new Hostmask({ source, nickname, username, hostname })
}
