/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
import {recoveryResult} from './save-recovery.mjs?v=20261006b';

if(recoveryResult.recovered){
  try{
    const key='hynoeSaveRecoveryReloadedV1';
    if(sessionStorage.getItem(key)!=='1'){
      sessionStorage.setItem(key,'1');
      location.reload();
    }
  }catch{}
}

// Native button click/tap activation is intentionally left untouched.
// The main game module owns mining input so touch, mouse and keyboard all share one path.
