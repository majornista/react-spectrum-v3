import {ActionButton} from '@react-spectrum/button';
import addons, { makeDecorator } from '@storybook/addons';
import {classNames} from '@react-spectrum/utils';
import {Content, View} from '@react-spectrum/view';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Flex} from '@react-spectrum/layout';
import {getQueryParams} from '@storybook/client-api';
import {Provider} from '@react-spectrum/provider';
import React, {useEffect, useState} from 'react';
import {Text} from '@react-spectrum/text';
import {themes, defaultTheme} from '../../constants';
import typographyStyles from '@adobe/spectrum-css-temp/components/typography/vars.css';

document.body.style.margin = 0;

const providerValuesFromUrl = Object.entries(getQueryParams()).reduce((acc, [k, v]) => {
  if (k.includes('providerSwitcher-')) {
    return { ...acc, [k.replace('providerSwitcher-', '')]: v };
  }
  return acc;
}, {});

function ProviderUpdater(props) {
  let [localeValue, setLocale] = useState(providerValuesFromUrl.locale || undefined);
  let [themeValue, setTheme] = useState(providerValuesFromUrl.theme || undefined);
  let [scaleValue, setScale] = useState(providerValuesFromUrl.scale || undefined);
  let [toastPositionValue, setToastPosition] = useState(providerValuesFromUrl.toastPosition || 'bottom');
  let [storyReady, setStoryReady] = useState(window.parent === window); // reduce content flash because it takes a moment to get the provider details
  // Typically themes are provided with both light + dark, and both scales.
  // To build our selector to see all themes, we need to hack it a bit.
  let theme = themes[themeValue] || defaultTheme;
  let colorScheme = themeValue && themeValue.replace(/est$/, '');
  useEffect(() => {
    let channel = addons.getChannel();
    let providerUpdate = (event) => {
      setLocale(event.locale);
      setTheme(event.theme === 'Auto' ? undefined : event.theme);
      setScale(event.scale === 'Auto' ? undefined : event.scale);
      setToastPosition(event.toastPosition);
      setStoryReady(true);
    };

    channel.on('provider/updated', providerUpdate);
    channel.emit('rsp/ready-for-update');
    return () => {
      channel.removeListener('provider/updated', providerUpdate);
    };
  }, []);

  if (props.context.kind && props.context.story) {
    document.title = `${props.context.kind}: ${props.context.story} | Storybook`;
  }

  return (
    <Provider theme={theme} colorScheme={colorScheme} scale={scaleValue} locale={localeValue} toastPlacement={toastPositionValue}>
      <Flex direction="column" minHeight="100vh">
        <View elementType="header">
          <Flex
            alignContent="center"
            alignItems="center"
            direction="row-reverse"
            gap="size-150"
            margin="size-150"
            wrap="wrap-reverse">
            {props.context.parameters.note && (
              <div role="note">
                <DialogTrigger type="popover">
                  <ActionButton>Note</ActionButton>
                  <Dialog>
                    <Content><Text>{props.context.parameters.note}</Text></Content>
                  </Dialog>
                </DialogTrigger>
              </div>
            )}
            <output aria-label="React version" aria-live="off">{REACT_VERSION}</output>
            {storyReady && props.context.kind && (
              <h1 className={classNames(typographyStyles, 'spectrum-Heading--pageTitle')} style={{flexGrow: 1}}>
                {props.context.kind}
                {props.context.story && <div className={classNames(typographyStyles, 'spectrum-Heading--subtitle2')}>{props.context.story}</div>}
              </h1>
            )}
          </Flex>
        </View>
        <main
          style={{
            alignItems: 'center',
            display: 'flex',
            flexGrow: 1,
            justifyContent: 'center',
            marginBlockEnd: 'var(--spectrum-global-dimension-size-150)'
          }}>
          {storyReady && props.children}
        </main>
      </Flex>
    </Provider>
  );
}

export const withProviderSwitcher = makeDecorator({
  name: 'withProviderSwitcher',
  parameterName: 'providerSwitcher',
  wrapper: (getStory, context, {options, parameters}) => {
    options = {...options, ...parameters};
    return (
      <ProviderUpdater options={options} context={context}>
        {getStory(context)}
      </ProviderUpdater>
    );
  }
});
