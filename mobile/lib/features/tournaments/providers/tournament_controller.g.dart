// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tournament_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$tournamentControllerHash() =>
    r'223b713b8b39a7494f7a888dd6f9986d3294ef94';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$TournamentController
    extends BuildlessAutoDisposeAsyncNotifier<List<Tournament>> {
  late final String? sport;

  FutureOr<List<Tournament>> build({
    String? sport,
  });
}

/// See also [TournamentController].
@ProviderFor(TournamentController)
const tournamentControllerProvider = TournamentControllerFamily();

/// See also [TournamentController].
class TournamentControllerFamily extends Family<AsyncValue<List<Tournament>>> {
  /// See also [TournamentController].
  const TournamentControllerFamily();

  /// See also [TournamentController].
  TournamentControllerProvider call({
    String? sport,
  }) {
    return TournamentControllerProvider(
      sport: sport,
    );
  }

  @override
  TournamentControllerProvider getProviderOverride(
    covariant TournamentControllerProvider provider,
  ) {
    return call(
      sport: provider.sport,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'tournamentControllerProvider';
}

/// See also [TournamentController].
class TournamentControllerProvider extends AutoDisposeAsyncNotifierProviderImpl<
    TournamentController, List<Tournament>> {
  /// See also [TournamentController].
  TournamentControllerProvider({
    String? sport,
  }) : this._internal(
          () => TournamentController()..sport = sport,
          from: tournamentControllerProvider,
          name: r'tournamentControllerProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$tournamentControllerHash,
          dependencies: TournamentControllerFamily._dependencies,
          allTransitiveDependencies:
              TournamentControllerFamily._allTransitiveDependencies,
          sport: sport,
        );

  TournamentControllerProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.sport,
  }) : super.internal();

  final String? sport;

  @override
  FutureOr<List<Tournament>> runNotifierBuild(
    covariant TournamentController notifier,
  ) {
    return notifier.build(
      sport: sport,
    );
  }

  @override
  Override overrideWith(TournamentController Function() create) {
    return ProviderOverride(
      origin: this,
      override: TournamentControllerProvider._internal(
        () => create()..sport = sport,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        sport: sport,
      ),
    );
  }

  @override
  AutoDisposeAsyncNotifierProviderElement<TournamentController,
      List<Tournament>> createElement() {
    return _TournamentControllerProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TournamentControllerProvider && other.sport == sport;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, sport.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TournamentControllerRef
    on AutoDisposeAsyncNotifierProviderRef<List<Tournament>> {
  /// The parameter `sport` of this provider.
  String? get sport;
}

class _TournamentControllerProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<TournamentController,
        List<Tournament>> with TournamentControllerRef {
  _TournamentControllerProviderElement(super.provider);

  @override
  String? get sport => (origin as TournamentControllerProvider).sport;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
