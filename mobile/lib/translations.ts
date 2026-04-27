export type Translation = {
  id: string;
  name: string;
  abbr: string;
  youVersionId: number;
  yvLicensed: boolean;
  esvLicensed?: boolean;
  copyright?: string;
};

export const TRANSLATIONS: Translation[] = [
  {
    id: 'kjv', name: 'King James Version', abbr: 'KJV',
    youVersionId: 1, yvLicensed: false,
  },
  {
    id: 'niv', name: 'New International Version', abbr: 'NIV',
    youVersionId: 111, yvLicensed: true,
    copyright: 'Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  },
  {
    id: 'nirv', name: "New International Reader's Version", abbr: 'NIrV',
    youVersionId: 110, yvLicensed: true,
    copyright: 'Copyright ©1995, 1996, 1998, 2014 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  },
  {
    id: 'nivuk', name: 'NIV (Anglicised)', abbr: 'NIVUK',
    youVersionId: 113, yvLicensed: true,
    copyright: 'Holy Bible, New International Version® Anglicised, NIV® Copyright ©1979, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  },
  {
    id: 'esv', name: 'English Standard Version', abbr: 'ESV',
    youVersionId: 59, yvLicensed: false, esvLicensed: true,
    copyright: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
  },
  {
    id: 'web', name: 'World English Bible', abbr: 'WEB',
    youVersionId: 206, yvLicensed: false,
  },
  {
    id: 'asv', name: 'American Standard Version', abbr: 'ASV',
    youVersionId: 12, yvLicensed: false,
  },
];

export const DEFAULT_TRANSLATION = 'kjv';

export function getTranslation(id: string): Translation {
  return TRANSLATIONS.find(t => t.id === id) ?? TRANSLATIONS[0];
}
